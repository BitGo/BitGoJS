import * as sjcl from '@bitgo/sjcl';
import {
  assertSafeLegacyV1Envelope,
  base64String,
  boundedInt,
  decodeWithCodec,
  LEGACY_V1_MAX_ITER,
} from '@bitgo/sdk-core';
import * as t from 'io-ts';

/**
 * Upper bound on PBKDF2 iterations accepted from a v1 envelope. BitGo-produced
 * v1 envelopes use 10,000; this cap is 10x that. The v1 decrypt path enforces
 * it before handing the envelope to SJCL, which has no upper bound of its own.
 *
 * @deprecated Kept exported for compatibility only. Callers should use
 * `decrypt` or `decryptV1WithSjcl` instead of enforcing the cap themselves.
 */
export const V1_MAX_ITER = LEGACY_V1_MAX_ITER;

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

/**
 * @deprecated Kept exported for compatibility only. The v1 decrypt path no
 * longer uses this strict codec: it rejects envelope shapes (such as a missing
 * `v` field) that SJCL's own decoder still accepts. Use `decryptV1WithSjcl`.
 */
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
 * Decrypt a v1 (SJCL PBKDF2-SHA256 + AES-CCM) envelope.
 *
 * The single v1 decrypt engine on every runtime (Node, browser, worker):
 * `assertSafeLegacyV1Envelope` screens the envelope, then SJCL's own decoder
 * handles it, accepting every historical shape including envelopes without
 * a `v` field.
 */
export async function decryptV1WithSjcl(password: string, ciphertext: string): Promise<string> {
  assertSafeLegacyV1Envelope(ciphertext);
  return sjcl.decrypt(password, ciphertext);
}

/**
 * @deprecated Kept exported for compatibility only. Equivalent to
 * `decryptV1WithSjcl`; prefer `decrypt`, which auto-detects v1/v2 envelopes.
 */
export async function decryptV1(password: string, ciphertext: string): Promise<string> {
  return decryptV1WithSjcl(password, ciphertext);
}
