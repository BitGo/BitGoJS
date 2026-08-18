import * as sjcl from '@bitgo/sjcl';
import { randomBytes } from 'crypto';

import { decryptV1 } from './decryptV1';
import { decryptV2, encryptV2 } from './encryptV2';

/**
 * convert a 4 element Uint8Array to a 4 byte Number
 *
 * @param bytes
 * @return 4 byte number
 */
export function bytesToWord(bytes?: Uint8Array | number[]): number {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 4) {
    throw new Error('bytes must be a Uint8Array with length 4');
  }
  return bytes.reduce((num, byte) => num * 0x100 + byte, 0);
}

/**
 * Internal v1 (SJCL PBKDF2-SHA256 + AES-256-CCM) encrypt helper.
 *
 * Not exported as part of the public encrypt/decrypt surface: callers must not use
 * this directly. v1 output is requested via `encrypt(..., { encryptionVersion: 1 })`.
 */
function encryptV1(
  password: string,
  plaintext: string,
  options?: { salt?: Buffer; iv?: Buffer; adata?: string }
): string {
  const salt = options?.salt || randomBytes(8);
  if (salt.length !== 8) throw new Error('salt must be 8 bytes');
  const iv = options?.iv || randomBytes(16);
  if (iv.length !== 16) throw new Error('iv must be 16 bytes');

  const encryptOptions: { iter: number; ks: number; salt: number[]; iv: number[]; adata?: string } = {
    iter: 10000,
    ks: 256,
    salt: [bytesToWord(salt.slice(0, 4)), bytesToWord(salt.slice(4))],
    iv: [
      bytesToWord(iv.slice(0, 4)),
      bytesToWord(iv.slice(4, 8)),
      bytesToWord(iv.slice(8, 12)),
      bytesToWord(iv.slice(12, 16)),
    ],
  };
  if (options?.adata) encryptOptions.adata = options.adata;
  return sjcl.encrypt(password, plaintext, encryptOptions);
}

/**
 * Encrypt `plaintext` with `password`. Defaults to v2 (Argon2id + AES-256-GCM).
 *
 * Pass `encryptionVersion: 1` to produce a legacy v1 (SJCL) envelope; this is the
 * only supported way to request v1 encryption.
 */
export async function encrypt(
  password: string,
  plaintext: string,
  options?: { salt?: Buffer; iv?: Buffer; adata?: string; encryptionVersion?: 1 | 2 }
): Promise<string> {
  if (options?.encryptionVersion === 1) {
    return encryptV1(password, plaintext, options);
  }
  return encryptV2(password, plaintext, { adata: options?.adata });
}

/**
 * Iter-cap violations are the only error we refuse to fall back on: SJCL has
 * no upper bound on `iter`, so falling through to it would let a hostile
 * envelope burn CPU running an inflated PBKDF2. Everything else -- codec
 * rejection of a shape SJCL would accept, native crypto bug, auth-tag
 * mismatch -- is safe to fall through to SJCL.
 */
function isIterCapViolation(err: unknown): boolean {
  return err instanceof Error && /iter:\s*expected integer|iter out of range/i.test(err.message);
}

/**
 * v1 decrypt with an SJCL safety net.
 *
 * Design intent during rollout: zero false negatives. Any native failure
 * (envelope shape our stricter codec rejects, framing bug, unsupported
 * algorithm, auth-tag mismatch, etc.) falls through to `sjcl.decrypt` so the
 * caller is never blocked. The only exception is an iter-cap violation,
 * which is rethrown to preserve DoS protection.
 *
 * The console.warn only fires when native fails AND SJCL succeeds -- i.e.
 * when the two engines disagree, which is the only signal worth
 * investigating. Wrong password fails both engines silently and surfaces
 * SJCL's auth error (mapped upstream to "incorrect password").
 *
 * `native` defaults to the module's `decryptV1` but is exposed as a parameter
 * so tests can inject a throwing version to exercise the fallback path.
 */
export async function decryptV1WithFallback(
  password: string,
  ciphertext: string,
  native: (pw: string, ct: string) => Promise<string> = decryptV1
): Promise<string> {
  try {
    return await native(password, ciphertext);
  } catch (nativeErr) {
    if (isIterCapViolation(nativeErr)) throw nativeErr;
    let result: string;
    try {
      result = sjcl.decrypt(password, ciphertext);
    } catch (sjclErr) {
      // Both engines rejected -- almost certainly a real auth failure.
      // Rethrow SJCL's error so BitGoAPI.decrypt maps it to "incorrect password".
      throw sjclErr;
    }
    // Native failed but SJCL succeeded -- real signal, log for the operator.
    const message = nativeErr instanceof Error ? nativeErr.message : String(nativeErr);
    // eslint-disable-next-line no-console
    console.warn('[bitgo-sdk] v1 native decrypt failed; SJCL fallback succeeded:', message);
    return result;
  }
}

/**
 * Auto-detect v1 (PBKDF2-SHA256 + AES-CCM) or v2 (Argon2id + AES-256-GCM)
 * from the envelope `v` field and decrypt.
 */
export async function decrypt(password: string, ciphertext: string): Promise<string> {
  let envelopeVersion: number | undefined;
  try {
    const envelope = JSON.parse(ciphertext);
    envelopeVersion = envelope.v;
  } catch {
    throw new Error('decrypt: ciphertext is not valid JSON');
  }
  if (envelopeVersion === 2) {
    // Do not catch: wrong password on v2 must not silently fall through to v1.
    return decryptV2(password, ciphertext);
  }
  if (envelopeVersion !== undefined && envelopeVersion !== 1) {
    throw new Error(`decrypt: unknown envelope version ${envelopeVersion}`);
  }
  return decryptV1WithFallback(password, ciphertext);
}
