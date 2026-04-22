import { argon2id } from '@bitgo/argon2';
import { base64String, boundedInt, decodeWithCodec } from '@bitgo/sdk-core';
import { randomBytes } from 'crypto';
import * as t from 'io-ts';

/** Default Argon2id parameters per RFC 9106 second recommendation
 * @see https://www.rfc-editor.org/rfc/rfc9106#section-4
 */
export const ARGON2_DEFAULTS = {
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
export const GCM_IV_LENGTH = 12;

/** HKDF per-call salt length in bytes */
export const HKDF_SALT_LENGTH = 32;

/** Fixed HKDF info string for domain separation across BitGo v2 session keys */
const HKDF_INFO = new TextEncoder().encode('bitgo-v2-session');

// Envelope codec

const V2EnvelopeCodec = t.intersection([
  t.type({
    v: t.literal(2),
    m: boundedInt(1, ARGON2_MAX.memorySize, 'memorySize'),
    t: boundedInt(1, ARGON2_MAX.iterations, 'iterations'),
    p: boundedInt(1, ARGON2_MAX.parallelism, 'parallelism'),
    salt: base64String,
    iv: base64String,
    ct: base64String,
  }),
  t.partial({
    /** Base64-encoded per-call HKDF salt -- present only in session-produced envelopes */
    hkdfSalt: base64String,
  }),
]);

export type V2Envelope = t.TypeOf<typeof V2EnvelopeCodec>;

// Crypto helpers

async function argon2Hash(
  password: string,
  salt: Uint8Array,
  params: { memorySize: number; iterations: number; parallelism: number }
): Promise<Uint8Array> {
  return argon2id({
    password,
    salt,
    memorySize: params.memorySize,
    iterations: params.iterations,
    parallelism: params.parallelism,
    hashLength: ARGON2_DEFAULTS.hashLength,
    outputType: 'binary',
  });
}

async function argon2ToAesKey(
  password: string,
  salt: Uint8Array,
  params: { memorySize: number; iterations: number; parallelism: number }
): Promise<CryptoKey> {
  const keyBytes = await argon2Hash(password, salt, params);
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function argon2ToHkdfKey(
  password: string,
  salt: Uint8Array,
  params: { memorySize: number; iterations: number; parallelism: number }
): Promise<CryptoKey> {
  const keyBytes = await argon2Hash(password, salt, params);
  return crypto.subtle.importKey('raw', keyBytes, 'HKDF', false, ['deriveKey']);
}

export function hkdfDeriveAesKey(hkdfKey: CryptoKey, hkdfSalt: Uint8Array, usage: KeyUsage): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info: HKDF_INFO },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage]
  );
}

export async function aesGcmEncrypt(key: CryptoKey, iv: Uint8Array, plaintext: string): Promise<Uint8Array> {
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    new TextEncoder().encode(plaintext)
  );
  return new Uint8Array(ct);
}

export async function aesGcmDecrypt(key: CryptoKey, iv: Uint8Array, ct: Uint8Array): Promise<string> {
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, ct);
  return new TextDecoder().decode(plaintext);
}

export function parseV2Envelope(ciphertext: string): V2Envelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(ciphertext);
  } catch {
    throw new Error('v2 decrypt: invalid JSON envelope');
  }
  return decodeWithCodec(V2EnvelopeCodec, parsed, 'v2 decrypt: invalid envelope');
}

// Public API

/**
 * Encrypt plaintext using Argon2id KDF + AES-256-GCM.
 *
 * Returns a self-describing JSON v2 envelope containing all Argon2id parameters,
 * salt, IV, and ciphertext -- fully standalone for decryption.
 *
 * For multi-call operations (MPC signing, wallet creation), prefer
 * createEncryptionSession to run Argon2id once and derive per-call keys via HKDF.
 */
export async function encryptV2(
  password: string,
  plaintext: string,
  options?: { salt?: Uint8Array; iv?: Uint8Array; memorySize?: number; iterations?: number; parallelism?: number }
): Promise<string> {
  const memorySize = options?.memorySize ?? ARGON2_DEFAULTS.memorySize;
  const iterations = options?.iterations ?? ARGON2_DEFAULTS.iterations;
  const parallelism = options?.parallelism ?? ARGON2_DEFAULTS.parallelism;

  const salt = options?.salt ?? new Uint8Array(randomBytes(ARGON2_DEFAULTS.saltLength));
  if (salt.length !== ARGON2_DEFAULTS.saltLength) throw new Error(`salt must be ${ARGON2_DEFAULTS.saltLength} bytes`);

  const iv = options?.iv ?? new Uint8Array(randomBytes(GCM_IV_LENGTH));
  if (iv.length !== GCM_IV_LENGTH) throw new Error(`iv must be ${GCM_IV_LENGTH} bytes`);

  const key = await argon2ToAesKey(password, salt, { memorySize, iterations, parallelism });
  const ct = await aesGcmEncrypt(key, iv, plaintext);

  return JSON.stringify({
    v: 2,
    m: memorySize,
    t: iterations,
    p: parallelism,
    salt: Buffer.from(salt).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    ct: Buffer.from(ct).toString('base64'),
  } satisfies V2Envelope);
}

/**
 * Decrypt a v2 envelope (Argon2id + AES-256-GCM).
 *
 * Handles both envelope types automatically:
 *   - Standard  (no hkdfSalt): Argon2id -> AES-GCM
 *   - Session   (hkdfSalt present): Argon2id -> HKDF -> AES-GCM
 *
 * All parameters are stored in the envelope -- no session context required.
 */
export async function decryptV2(password: string, ciphertext: string): Promise<string> {
  const envelope = parseV2Envelope(ciphertext);
  const salt = new Uint8Array(Buffer.from(envelope.salt, 'base64'));
  const iv = new Uint8Array(Buffer.from(envelope.iv, 'base64'));
  const ct = new Uint8Array(Buffer.from(envelope.ct, 'base64'));
  const params = { memorySize: envelope.m, iterations: envelope.t, parallelism: envelope.p };

  if (envelope.hkdfSalt) {
    const hkdfKey = await argon2ToHkdfKey(password, salt, params);
    const hkdfSalt = new Uint8Array(Buffer.from(envelope.hkdfSalt, 'base64'));
    const aesKey = await hkdfDeriveAesKey(hkdfKey, hkdfSalt, 'decrypt');
    return aesGcmDecrypt(aesKey, iv, ct);
  }

  const key = await argon2ToAesKey(password, salt, params);
  return aesGcmDecrypt(key, iv, ct);
}
