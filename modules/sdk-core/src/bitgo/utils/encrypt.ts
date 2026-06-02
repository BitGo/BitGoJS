import { argon2id } from '@bitgo/argon2';
import * as sjcl from '@bitgo/sjcl';
import { randomBytes, webcrypto } from 'crypto';
import * as t from 'io-ts';

import { base64String, boundedInt, decodeWithCodec } from './codecs';

const subtle = globalThis.crypto?.subtle ?? webcrypto.subtle;

const ARGON2_DEFAULTS = { memorySize: 65536, iterations: 3, parallelism: 4, hashLength: 32, saltLength: 16 } as const;
const ARGON2_MAX = { memorySize: 262144, iterations: 16, parallelism: 16 } as const;
const GCM_IV_LENGTH = 12;
const HKDF_INFO = new TextEncoder().encode('bitgo-v2-session');

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
  t.partial({ hkdfSalt: base64String, adata: t.string }),
]);

type V2Envelope = t.TypeOf<typeof V2EnvelopeCodec>;

async function argon2ToAesKey(
  password: string,
  salt: Uint8Array,
  params: { memorySize: number; iterations: number; parallelism: number },
  usage: KeyUsage
): Promise<CryptoKey> {
  const keyBytes = await argon2id({
    password,
    salt,
    ...params,
    hashLength: ARGON2_DEFAULTS.hashLength,
    outputType: 'binary',
  });
  return subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [usage]);
}

async function argon2ToHkdfKey(
  password: string,
  salt: Uint8Array,
  params: { memorySize: number; iterations: number; parallelism: number }
): Promise<CryptoKey> {
  const keyBytes = await argon2id({
    password,
    salt,
    ...params,
    hashLength: ARGON2_DEFAULTS.hashLength,
    outputType: 'binary',
  });
  return subtle.importKey('raw', keyBytes, 'HKDF', false, ['deriveKey']);
}

function hkdfDeriveAesKey(hkdfKey: CryptoKey, hkdfSalt: Uint8Array, usage: KeyUsage): Promise<CryptoKey> {
  return subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info: HKDF_INFO },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage]
  );
}

async function aesGcmEncrypt(
  key: CryptoKey,
  iv: Uint8Array,
  plaintext: string,
  adata?: Uint8Array
): Promise<Uint8Array> {
  const params: AesGcmParams = { name: 'AES-GCM', iv, tagLength: 128 };
  if (adata) params.additionalData = adata;
  const ct = await subtle.encrypt(params, key, new TextEncoder().encode(plaintext));
  return new Uint8Array(ct);
}

async function aesGcmDecrypt(key: CryptoKey, iv: Uint8Array, ct: Uint8Array, adata?: Uint8Array): Promise<string> {
  const params: AesGcmParams = { name: 'AES-GCM', iv, tagLength: 128 };
  if (adata) params.additionalData = adata;
  const plaintext = await subtle.decrypt(params, key, ct);
  return new TextDecoder().decode(plaintext);
}

/** Encrypt plaintext using Argon2id KDF + AES-256-GCM. */
export async function encryptV2(
  password: string,
  plaintext: string,
  options?: { salt?: Uint8Array; iv?: Uint8Array; memorySize?: number; iterations?: number; parallelism?: number }
): Promise<string> {
  const memorySize = options?.memorySize ?? ARGON2_DEFAULTS.memorySize;
  const iterations = options?.iterations ?? ARGON2_DEFAULTS.iterations;
  const parallelism = options?.parallelism ?? ARGON2_DEFAULTS.parallelism;
  const salt = options?.salt ?? new Uint8Array(randomBytes(ARGON2_DEFAULTS.saltLength));
  const iv = options?.iv ?? new Uint8Array(randomBytes(GCM_IV_LENGTH));

  const key = await argon2ToAesKey(password, salt, { memorySize, iterations, parallelism }, 'encrypt');
  const ct = await aesGcmEncrypt(key, iv, plaintext);

  const envelope: V2Envelope = {
    v: 2,
    m: memorySize,
    t: iterations,
    p: parallelism,
    salt: Buffer.from(salt).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    ct: Buffer.from(ct).toString('base64'),
  };
  return JSON.stringify(envelope);
}

async function decryptV2(password: string, ciphertext: string): Promise<string> {
  const envelope = decodeWithCodec(V2EnvelopeCodec, JSON.parse(ciphertext), 'v2 decrypt: invalid envelope');
  const salt = new Uint8Array(Buffer.from(envelope.salt, 'base64'));
  const iv = new Uint8Array(Buffer.from(envelope.iv, 'base64'));
  const ct = new Uint8Array(Buffer.from(envelope.ct, 'base64'));
  const params = { memorySize: envelope.m, iterations: envelope.t, parallelism: envelope.p };
  const adataBytes = envelope.adata ? new TextEncoder().encode(envelope.adata) : undefined;

  if (envelope.hkdfSalt) {
    const hkdfKey = await argon2ToHkdfKey(password, salt, params);
    const hkdfSalt = new Uint8Array(Buffer.from(envelope.hkdfSalt, 'base64'));
    const aesKey = await hkdfDeriveAesKey(hkdfKey, hkdfSalt, 'decrypt');
    return aesGcmDecrypt(aesKey, iv, ct, adataBytes);
  }

  const key = await argon2ToAesKey(password, salt, params, 'decrypt');
  return aesGcmDecrypt(key, iv, ct, adataBytes);
}

/**
 * Auto-detect v1 (SJCL) or v2 (Argon2id + AES-256-GCM) from the envelope `v` field and decrypt.
 */
export async function decryptAsync(password: string, ciphertext: string): Promise<string> {
  let envelopeVersion: number | undefined;
  try {
    const envelope = JSON.parse(ciphertext);
    envelopeVersion = envelope.v;
  } catch {
    throw new Error('decrypt: ciphertext is not valid JSON');
  }
  if (envelopeVersion === 2) {
    return decryptV2(password, ciphertext);
  }
  if (envelopeVersion !== undefined && envelopeVersion !== 1) {
    throw new Error(`decrypt: unknown envelope version ${envelopeVersion}`);
  }
  return sjcl.decrypt(password, ciphertext);
}
