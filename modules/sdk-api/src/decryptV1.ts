import { base64String, boundedInt, decodeWithCodec } from '@bitgo/sdk-core';
import { createDecipheriv, pbkdf2 } from 'crypto';
import * as t from 'io-ts';
import { promisify } from 'util';

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
 * Decrypt a v1 (SJCL PBKDF2-SHA256 + AES-CCM) envelope with Node's native
 * `node:crypto`.
 *
 * Node runtimes only: the `crypto` webpack substitutes in browser bundles
 * (`crypto-browserify`) has no working AES-CCM, so `decryptV1WithFallback`
 * routes browser runtimes straight to the frozen SJCL decoder instead of
 * ever calling this.
 */
export async function decryptV1(password: string, ciphertext: string): Promise<string> {
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
  const key: Buffer = await promisify(pbkdf2)(password, salt, env.iter, keyBytes, 'sha256');

  const decipher = createDecipheriv(`aes-${env.ks}-ccm`, key, iv, { authTagLength: tagBytes });
  decipher.setAuthTag(authTag);
  const aad = env.adata ? Buffer.from(env.adata, 'utf8') : Buffer.alloc(0);
  decipher.setAAD(aad, { plaintextLength: cipher.length });

  const pt = Buffer.concat([decipher.update(cipher), decipher.final()]);
  return pt.toString('utf8');
}
