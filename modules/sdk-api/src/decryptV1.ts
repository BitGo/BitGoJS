import { base64String, boundedInt, decodeWithCodec } from '@bitgo/sdk-core';
import { createDecipheriv, pbkdf2 } from 'crypto';
import * as t from 'io-ts';
import { promisify } from 'util';

/**
 * Minimal shape the decrypt path needs from a crypto module. Both `node:crypto`
 * and `crypto-browserify` satisfy this. Passing this in from tests lets the
 * browser-shim test suite exercise the real decrypt code instead of a copy.
 */
export interface CryptoModule {
  pbkdf2: typeof pbkdf2;
  createDecipheriv: typeof createDecipheriv;
}

const defaultCrypto: CryptoModule = { pbkdf2, createDecipheriv };

/**
 * Upper bound on PBKDF2 iterations accepted from a v1 envelope. BitGo-produced
 * v1 envelopes use 10,000; this cap is 10x that. Envelope validation enforces
 * it up front before any KDF work runs.
 */
export const V1_MAX_ITER = 100_000;

/**
 * io-ts codec for a v1 (SJCL) envelope.
 *
 * Enforces the shape and the `iter` cap up front, before any KDF work runs.
 */
const V1EnvelopeCodec = t.intersection([
  t.type({
    v: t.literal(1),
    iter: boundedInt(1, V1_MAX_ITER, 'iter'),
    ks: t.union([t.literal(128), t.literal(256)]),
    ts: t.union([t.literal(64), t.literal(96), t.literal(128)]),
    mode: t.literal('ccm'),
    cipher: t.literal('aes'),
    salt: base64String,
    iv: base64String,
    ct: base64String,
  }),
  t.partial({
    adata: t.string,
  }),
]);

export type V1Envelope = t.TypeOf<typeof V1EnvelopeCodec>;

export function parseV1Envelope(ciphertext: string): V1Envelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(ciphertext);
  } catch {
    throw new Error('v1 decrypt: invalid JSON envelope');
  }
  return decodeWithCodec(V1EnvelopeCodec, parsed, 'v1 decrypt: invalid envelope');
}

/**
 * CCM length field size L, in bytes, chosen to encode the plaintext length.
 *
 * SJCL picks the smallest L in [2, 4) that can represent the plaintext length,
 * then derives the nonce length as (15 - L). We mirror that so Node's CCM
 * uses the same nonce framing as the SJCL encoder produced.
 */
function ccmNonceLength(plaintextLen: number): number {
  let L = 2;
  while (L < 4 && plaintextLen >= Math.pow(2, 8 * L)) L++;
  return 15 - L;
}

/**
 * Decrypt a parsed v1 envelope given a crypto module.
 *
 * v1 = PBKDF2-SHA256(password, salt, iter, keyLen) then AES-CCM(key, nonce, ct||tag).
 * Byte-for-byte compatible with `sjcl.decrypt` output for the same envelope.
 *
 * Exported so tests can inject `crypto-browserify` and exercise the exact
 * runtime path the webpack browser bundle produces, without duplicating the
 * decrypt logic.
 */
export async function decryptV1WithCrypto(password: string, ciphertext: string, crypto: CryptoModule): Promise<string> {
  const env = parseV1Envelope(ciphertext);
  const salt = Buffer.from(env.salt, 'base64');
  const ivFull = Buffer.from(env.iv, 'base64');
  const full = Buffer.from(env.ct, 'base64');
  const tagBytes = env.ts / 8;
  if (full.length < tagBytes) throw new Error('v1 decrypt: ciphertext shorter than tag');

  const cipher = full.subarray(0, full.length - tagBytes);
  const authTag = full.subarray(full.length - tagBytes);
  const nonceLen = ccmNonceLength(cipher.length);
  if (ivFull.length < nonceLen) throw new Error('v1 decrypt: iv shorter than nonce');
  const iv = ivFull.subarray(0, nonceLen);

  const keyBytes = env.ks / 8;
  const key: Buffer = await promisify(crypto.pbkdf2)(password, salt, env.iter, keyBytes, 'sha256');

  const decipher = crypto.createDecipheriv(`aes-${env.ks}-ccm`, key, iv, { authTagLength: tagBytes });
  decipher.setAuthTag(authTag);
  const aad = env.adata ? Buffer.from(env.adata, 'utf8') : Buffer.alloc(0);
  decipher.setAAD(aad, { plaintextLength: cipher.length });

  const pt = Buffer.concat([decipher.update(cipher), decipher.final()]);
  return pt.toString('utf8');
}

/**
 * Decrypt a v1 (SJCL PBKDF2-SHA256 + AES-CCM) envelope.
 *
 * Runs the same `node:crypto` code on server and browser. The BitGoJS webpack
 * config already maps `crypto` -> `crypto-browserify`, whose `aes-256-ccm` and
 * `pbkdf2` implementations are byte-compatible with Node's native ones and
 * with SJCL's envelope format. Parity is guarded by tests in
 * `test/unit/decryptV1.browser.ts`.
 */
export async function decryptV1(password: string, ciphertext: string): Promise<string> {
  return decryptV1WithCrypto(password, ciphertext, defaultCrypto);
}
