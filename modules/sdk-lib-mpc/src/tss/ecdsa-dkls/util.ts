import { Signature } from '@noble/secp256k1';
import { Secp256k1Curve } from '../../curves';
import { bigIntFromBufferBE, bigIntToBufferBE } from '../../util';
import { DeserializedDklsSignature } from './types';
import { decode } from 'cbor';
import * as secp256k1 from 'secp256k1';
import { Hash, createHash } from 'crypto';

const delimeter = ':';

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

/**
 * Verify a DKLs Signature and serialize it to recid:r:s:publickey format.
 * @param message - message that was signed.
 * @param dklsSignature - R and S values of the ECDSA signature.
 * @param commonKeychain - public key appended to chaincode in hex.
 * @param hash - optional hash function to apply on message before verifying. Default is sha256.
 * @param shouldHash - flag to determine whether message should be hashed before verifying.
 * @returns {string} - serialized signature in `recid:r:s:publickey` format
 */
export function verifyAndConvertDklsSignature(
  message: Buffer,
  dklsSignature: DeserializedDklsSignature,
  commonKeychain: string,
  hash?: Hash,
  shouldHash = true
): string {
  const messageToVerify = shouldHash ? (hash || createHash('sha256')).update(message).digest() : message;
  const pub0 = secp256k1.ecdsaRecover(Buffer.concat([dklsSignature.R, dklsSignature.S]), 0, messageToVerify, true);
  const pub1 = secp256k1.ecdsaRecover(Buffer.concat([dklsSignature.R, dklsSignature.S]), 1, messageToVerify, true);
  const truePub = commonKeychain.slice(0, 66);
  let recId: number;
  if (truePub === Buffer.from(pub0).toString('hex')) {
    recId = 0;
  } else if (truePub === Buffer.from(pub1).toString('hex')) {
    recId = 1;
  } else {
    throw Error('Invalid Signature');
  }
  return `${recId}${delimeter}${Buffer.from(dklsSignature.R).toString('hex')}${delimeter}${Buffer.from(
    dklsSignature.S
  ).toString('hex')}${delimeter}${truePub}`;
}
