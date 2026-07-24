import * as sjcl from '@bitgo/sjcl';
import { randomBytes } from 'crypto';

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
 * Internal v1 (SJCL) decrypt helper. Not part of the public surface: callers use
 * the auto-detecting `decrypt` instead.
 */
function decryptV1(password: string, ciphertext: string): string {
  return sjcl.decrypt(password, ciphertext);
}

/**
 * Auto-detect v1 (SJCL) or v2 (Argon2id + AES-256-GCM) from the envelope `v` field and decrypt.
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
  return decryptV1(password, ciphertext);
}
