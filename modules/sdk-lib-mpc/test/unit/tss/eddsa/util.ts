import { EddsaMPSDsg } from '../../../../src/tss/eddsa-mps';
import { DeserializedMessage } from '../../../../src/tss/eddsa-mps/types';

// Re-export the production helper so existing tests can resolve via './util'
// without a separate, drifting copy.
export { generateEdDsaDKGKeyShares } from '../../../../src/tss/eddsa-mps/util';

/**
 * Runs a full 2-of-3 EdDSA DSG protocol between two parties holding `keyShareA`
 * and `keyShareB`, signing `message` under `derivationPath`.
 *
 * Returns both parties' resulting `DSG` instances so callers can compare signatures
 * (`dsgA.getSignature()` and `dsgB.getSignature()` should be byte-identical) or
 * verify against a public key.
 */
export function runEdDsaDSG(
  keyShareA: Buffer,
  keyShareB: Buffer,
  partyAIdx: number,
  partyBIdx: number,
  message: Buffer,
  derivationPath = 'm'
): { dsgA: EddsaMPSDsg.DSG; dsgB: EddsaMPSDsg.DSG } {
  const dsgA = new EddsaMPSDsg.DSG(partyAIdx);
  const dsgB = new EddsaMPSDsg.DSG(partyBIdx);

  dsgA.initDsg(keyShareA, message, derivationPath, partyBIdx);
  dsgB.initDsg(keyShareB, message, derivationPath, partyAIdx);

  // Round 0 -> SignMsg1
  const a0: DeserializedMessage = dsgA.getFirstMessage();
  const b0: DeserializedMessage = dsgB.getFirstMessage();

  // Round 1 -> SignMsg2
  const [a1] = dsgA.handleIncomingMessages([a0, b0]);
  const [b1] = dsgB.handleIncomingMessages([a0, b0]);

  // Round 2 -> SignMsg3 (partial sig)
  const [a2] = dsgA.handleIncomingMessages([a1, b1]);
  const [b2] = dsgB.handleIncomingMessages([a1, b1]);

  // Round 3 -> Complete (no output messages)
  dsgA.handleIncomingMessages([a2, b2]);
  dsgB.handleIncomingMessages([a2, b2]);

  return { dsgA, dsgB };
}
