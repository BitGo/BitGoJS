import * as sjcl from '@bitgo-beta/sjcl';
import { randomBytes } from 'crypto';

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

export function encrypt(
  password: string,
  plaintext: string,
  options?: {
    salt?: Buffer;
    iv?: Buffer;
    adata?: string;
  }
): string {
  const salt = options?.salt || randomBytes(8);
  if (salt.length !== 8) {
    throw new Error(`salt must be 8 bytes`);
  }
  const iv = options?.iv || randomBytes(16);
  if (iv.length !== 16) {
    throw new Error(`iv must be 16 bytes`);
  }
  const encryptOptions: {
    iter: number;
    ks: number;
    salt: number[];
    iv: number[];
    adata?: string;
  } = {
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

  if (options?.adata) {
    encryptOptions.adata = options.adata;
  }

  return sjcl.encrypt(password, plaintext, encryptOptions);
}

export function decrypt(password: string, ciphertext: string): string {
  return sjcl.decrypt(password, ciphertext);
}
