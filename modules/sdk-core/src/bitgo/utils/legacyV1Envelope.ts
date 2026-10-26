import * as sjcl from '@bitgo/sjcl';

/**
 * Upper bound on PBKDF2 iterations accepted from a legacy v1 (SJCL) envelope.
 * BitGo only ever wrote 10,000; this cap is 10x that.
 */
export const LEGACY_V1_MAX_ITER = 100_000;

/**
 * Refuse hostile legacy v1 envelopes before SJCL sees them. SJCL reads `iter` and `mode`
 * from the envelope and has no upper bound on the iteration count, so a tampered envelope
 * could stall the caller with a huge PBKDF2 run or select the weak OCB2 mode. Absent
 * `iter` and `mode` take SJCL's defaults.
 *
 * The check reads the envelope with SJCL's own decoder, not JSON.parse. SJCL strips all
 * whitespace before decoding, so a key such as "it er" is `iter` to SJCL but unknown to
 * JSON.parse. Input SJCL cannot decode is left for `sjcl.decrypt` to report.
 *
 * @param ciphertext serialized v1 envelope
 * @throws if `iter` is not an integer between 1 and LEGACY_V1_MAX_ITER, or `mode` is not `ccm`
 */
export function assertSafeLegacyV1Envelope(ciphertext: string): void {
  let envelope: { iter?: unknown; mode?: unknown };
  try {
    envelope = sjcl.json.decode(ciphertext);
  } catch {
    return;
  }
  const { iter, mode } = envelope;
  if (
    iter !== undefined &&
    !(Number.isInteger(iter) && (iter as number) >= 1 && (iter as number) <= LEGACY_V1_MAX_ITER)
  ) {
    throw new Error(`v1 envelope: iter out of range, expected an integer between 1 and ${LEGACY_V1_MAX_ITER}`);
  }
  if (mode !== undefined && mode !== 'ccm') {
    throw new Error('v1 envelope: unsupported mode, expected ccm');
  }
}
