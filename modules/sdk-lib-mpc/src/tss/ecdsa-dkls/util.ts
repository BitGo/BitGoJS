import { Signature } from '@noble/secp256k1';
import { Secp256k1Curve } from '../../curves';
import { bigIntFromBufferBE, bigIntToBufferBE } from '../../util';
import { DeserializedDklsSignature } from './types';
import { decode } from 'cbor';

/**
 * Combines partial signatures from parties participating in DSG.
 * @param round4MessagePayloads - round 4 message payloads from participating parties
 * @param rHex - hex representation of the r value in the signature
 * @returns {DeserializedMessages} - messages to send to other parties for the next round
 */
export function combinePartialSignatures(round4MessagePayloads: Uint8Array[], rHex: string): DeserializedDklsSignature {
  const r = bigIntFromBufferBE(Buffer.from(rHex, 'hex').subarray(1));
  const s0Arr = round4MessagePayloads.map((p) => decode(p).s_0);
  const s1Arr = round4MessagePayloads.map((p) => decode(p).s_1);
  const s0BigInts = s0Arr.map((s0) => bigIntFromBufferBE(Buffer.from(s0)));
  const s1BigInts = s1Arr.map((s1) => bigIntFromBufferBE(Buffer.from(s1)));
  const secp256k1Curve = new Secp256k1Curve();
  const s0Sum = s0BigInts.slice(1).reduce((sumSoFar, s0) => secp256k1Curve.scalarAdd(sumSoFar, s0), s0BigInts[0]);
  const s1Sum = s1BigInts.slice(1).reduce((sumSoFar, s1) => secp256k1Curve.scalarAdd(sumSoFar, s1), s1BigInts[0]);
  const s = secp256k1Curve.scalarMult(s0Sum, secp256k1Curve.scalarInvert(s1Sum));
  const sig = new Signature(r, s);
  const normalizedSig = sig.normalizeS();
  return {
    R: new Uint8Array(bigIntToBufferBE(normalizedSig.r)),
    S: new Uint8Array(bigIntToBufferBE(normalizedSig.s)),
  };
}
