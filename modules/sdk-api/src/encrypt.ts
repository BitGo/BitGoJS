import * as sjcl from '@bitgo/sjcl';
import { randomBytes } from 'crypto';

import { decryptV2 } from './encryptV2';

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

/** Encrypt using legacy v1 SJCL (PBKDF2-SHA256 + AES-256-CCM). */
export function encrypt(
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

/** Decrypt a v1 SJCL envelope. */
export function decrypt(password: string, ciphertext: string): string {
  return sjcl.decrypt(password, ciphertext);
}

/**
 * Auto-detect v1 (SJCL) or v2 (Argon2id + AES-256-GCM) from the envelope `v` field and decrypt.
 *
 * Migration path from sync `decrypt()`. Move call sites to `decryptAsync()` before
 * the breaking release that flips the default to v2.
 */
export async function decryptAsync(password: string, ciphertext: string): Promise<string> {
  let isV2 = false;
  try {
    const envelope = JSON.parse(ciphertext);
    isV2 = envelope.v === 2;
  } catch {
    throw new Error('decrypt: ciphertext is not valid JSON');
  }
  if (isV2) {
    // Do not catch: wrong password on v2 must not silently fall through to v1.
    return decryptV2(password, ciphertext);
  }
  return sjcl.decrypt(password, ciphertext);
}
