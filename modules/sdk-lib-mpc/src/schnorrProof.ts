/**
 * Implementation of Schnorr Non-interactive Zero-Knowledge Proof.
 * @see {@link https://datatracker.ietf.org/doc/rfc8235/}
 */
import { createHash } from 'crypto';
import { BaseCurve as Curve } from './curves';
import { SchnorrProof } from './types';
import { bigIntFromBufferBE, bigIntToBufferBE } from './util';

/**
 * Create a Schnorr Proof of knowledge of the discrete log of an Elliptic-curve point.
 * @param A The curve point.
 * @param a The discrete log of the curve point.
 * @param curve The elliptic curve.
 * @param additionalCtx Additional contextual information to associate with the proof.
 * @returns The created proof.
 */
export function createSchnorrProof(
  A: bigint,
  a: bigint,
  curve: Curve,
  additionalCtx: Buffer = Buffer.from('')
): SchnorrProof {
  const v = curve.scalarRandom();
  const V = curve.basePointMult(v);

  const c = nonInteractiveChallenge(V, A, curve, additionalCtx);

  const r = curve.scalarSub(v, curve.scalarMult(a, c));

  return {
    vPoint: V,
    r: r,
  };
}

/**
 * Calculate challenge for NIZK schnorr proof using Fiat-Shamir transform.
 *
 * @param V The point/public value corresponding to the random scalar value v chosen by the prover.
 * @param A The point to be proved.
 * @param curve The elliptic curve.
 * @param additionalCtx Additional contextual information to associate with the proof.
 * @returns The calculated challenge.
 */
function nonInteractiveChallenge(V: bigint, A: bigint, curve: Curve, additionalCtx: Buffer): bigint {
  const G = curve.basePointMult(BigInt(1));

  const hash = createHash('sha256');
  hash.update(bigIntToBufferBE(G, 32));
  hash.update(bigIntToBufferBE(V, 32));
  hash.update(bigIntToBufferBE(A, 32));
  hash.update(additionalCtx);

  return bigIntFromBufferBE(hash.digest());
}

/**
 * Verify a Schnorr Proof of knowledge of the discrete log of an Elliptic-curve point.
 * @param A The curve point.
 * @param proof The schnorr proof.
 * @param curve The elliptic curve.
 * @param additionalCtx Additional contextual information that is supposed to associate with the proof.
 * @returns True if the proof checks out.
 */
export function verifySchnorrProof(
  A: bigint,
  proof: SchnorrProof,
  curve: Curve,
  additionalCtx: Buffer = Buffer.from('')
): boolean {
  const c = nonInteractiveChallenge(proof.vPoint, A, curve, additionalCtx);

  const rG = curve.basePointMult(proof.r);

  const cA = curve.pointMultiply(A, curve.scalarReduce(c));

  return proof.vPoint === curve.pointAdd(rG, cA);
}
