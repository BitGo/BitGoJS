import { argon2id } from '@bitgo/argon2';
import * as sjcl from '@bitgo/sjcl';
import { randomBytes } from 'crypto';

/** Default Argon2id parameters per RFC 9106 second recommendation */
const ARGON2_DEFAULTS = {
  memorySize: 65536, // 64 MiB in KiB
  iterations: 3,
  parallelism: 4,
  hashLength: 32, // 256-bit key
  saltLength: 16, // 128-bit salt
} as const;

/** Maximum allowed Argon2id parameters to prevent DoS via crafted envelopes.
 * memorySize: 256 MiB (4x default) -- caps memory allocation on untrusted input.
 * iterations: 16 -- caps CPU time.
 * parallelism: 16 -- caps thread count.
 */
const ARGON2_MAX = {
  memorySize: 262144,
  iterations: 16,
  parallelism: 16,
} as const;

/** AES-256-GCM IV length in bytes */
const GCM_IV_LENGTH = 12;

export interface V2Envelope {
  v: 2;
  m: number;
  t: number;
  p: number;
  salt: string;
  iv: string;
  ct: string;
}

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

/**
 * Derive a 256-bit key from a password using Argon2id.
 */
async function deriveKeyV2(
  password: string,
  salt: Uint8Array,
  params: { memorySize: number; iterations: number; parallelism: number }
): Promise<CryptoKey> {
  const keyBytes = await argon2id({
    password,
    salt,
    memorySize: params.memorySize,
    iterations: params.iterations,
    parallelism: params.parallelism,
    hashLength: ARGON2_DEFAULTS.hashLength,
    outputType: 'binary',
  });

  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/**
 * Encrypt plaintext using Argon2id KDF + AES-256-GCM.
 *
 * Returns a JSON string containing a self-describing v2 envelope
 * with Argon2id parameters, salt, IV, and ciphertext.
 */
export async function encryptV2(
  password: string,
  plaintext: string,
  options?: {
    salt?: Uint8Array;
    iv?: Uint8Array;
    memorySize?: number;
    iterations?: number;
    parallelism?: number;
  }
): Promise<string> {
  const memorySize = options?.memorySize ?? ARGON2_DEFAULTS.memorySize;
  const iterations = options?.iterations ?? ARGON2_DEFAULTS.iterations;
  const parallelism = options?.parallelism ?? ARGON2_DEFAULTS.parallelism;

  const salt = options?.salt ?? new Uint8Array(randomBytes(ARGON2_DEFAULTS.saltLength));
  if (salt.length !== ARGON2_DEFAULTS.saltLength) {
    throw new Error(`salt must be ${ARGON2_DEFAULTS.saltLength} bytes`);
  }

  const iv = options?.iv ?? new Uint8Array(randomBytes(GCM_IV_LENGTH));
  if (iv.length !== GCM_IV_LENGTH) {
    throw new Error(`iv must be ${GCM_IV_LENGTH} bytes`);
  }

  const key = await deriveKeyV2(password, salt, { memorySize, iterations, parallelism });

  const plaintextBytes = new TextEncoder().encode(plaintext);
  const ctBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintextBytes);

  const envelope: V2Envelope = {
    v: 2,
    m: memorySize,
    t: iterations,
    p: parallelism,
    salt: Buffer.from(salt).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    ct: Buffer.from(ctBuffer).toString('base64'),
  };

  return JSON.stringify(envelope);
}

/**
 * Decrypt a v2 envelope (Argon2id KDF + AES-256-GCM).
 *
 * The envelope must contain: v, m, t, p, salt, iv, ct.
 */
export async function decryptV2(password: string, ciphertext: string): Promise<string> {
  let envelope: V2Envelope;
  try {
    envelope = JSON.parse(ciphertext);
  } catch {
    throw new Error('v2 decrypt: invalid JSON envelope');
  }

  if (envelope.v !== 2) {
    throw new Error(`v2 decrypt: unsupported envelope version ${envelope.v}`);
  }
  if (envelope.m > ARGON2_MAX.memorySize || envelope.m < 1) {
    throw new Error(`v2 decrypt: memorySize ${envelope.m} exceeds allowed range [1, ${ARGON2_MAX.memorySize}]`);
  }
  if (envelope.t > ARGON2_MAX.iterations || envelope.t < 1) {
    throw new Error(`v2 decrypt: iterations ${envelope.t} exceeds allowed range [1, ${ARGON2_MAX.iterations}]`);
  }
  if (envelope.p > ARGON2_MAX.parallelism || envelope.p < 1) {
    throw new Error(`v2 decrypt: parallelism ${envelope.p} exceeds allowed range [1, ${ARGON2_MAX.parallelism}]`);
  }

  const salt = new Uint8Array(Buffer.from(envelope.salt, 'base64'));
  const iv = new Uint8Array(Buffer.from(envelope.iv, 'base64'));
  const ct = new Uint8Array(Buffer.from(envelope.ct, 'base64'));

  const key = await deriveKeyV2(password, salt, {
    memorySize: envelope.m,
    iterations: envelope.t,
    parallelism: envelope.p,
  });

  const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);

  return new TextDecoder().decode(plaintextBuffer);
}
