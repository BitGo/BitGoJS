/**
 * Zero Knowledge Proof of knowledge of the s and l that are behind the public value V = sR + lG.
 * The V value is calculated in step 5A and the proof is created in step 5B of the GG18 signing protocol.
 * @see {@link https://eprint.iacr.org/2019/114.pdf} section 4.3 for reference.
 */
import { createHash } from 'crypto';
import { BaseCurve as Curve } from '../../curves';
import { ZkVProof } from './types';
import { bigIntFromBufferBE, bigIntToBufferBE } from '../../util';

/**
 * Create a ZK Proof of knowledge of the s and l that are behind the public value V = sR + lG.
 * @param V The curve point V.
 * @param s The s that multiplies R.
 * @param l The l that multiplies the curve genreator G.
 * @param R The curve point R shared by all participants.
 * @param curve The elliptic curve.
 * @param additionalCtx Additional contextual information to associate with the proof.
 * @returns The created proof.
 */
export function createZkVProof(
  V: bigint,
  s: bigint,
  l: bigint,
  R: bigint,
  curve: Curve,
  additionalCtx: Buffer = Buffer.from('')
): ZkVProof {
  const a = curve.scalarRandom();
  const b = curve.scalarRandom();
  const Alpha = curve.pointAdd(curve.pointMultiply(R, a), curve.basePointMult(b));

  const c = nonInteractiveChallenge(V, R, Alpha, curve, additionalCtx);

  const t = curve.scalarAdd(a, curve.scalarMult(c, s));
  const u = curve.scalarAdd(b, curve.scalarMult(c, l));

  return {
    Alpha: Alpha,
    t: t,
    u: u,
  };
}

/**
 * Calculate challenge for NIZK proof of V using Fiat-Shamir transform.
 *
 * @param V The point to be proven.
 * @param R The point R shared by all participants in the ECDSA signing protocol.
 * @param Alpha The point/public value corresponding to the random scalar values a and b chosen by the prover.
 * @param curve The elliptic curve.
 * @param additionalCtx Additional contextual information to associate with the proof.
 * @returns The calculated challenge.
 */
function nonInteractiveChallenge(V: bigint, R: bigint, Alpha: bigint, curve: Curve, additionalCtx: Buffer): bigint {
  const G = curve.basePointMult(BigInt(1));

  const hash = createHash('sha256');
  hash.update(bigIntToBufferBE(G, curve.pointBytes));
  hash.update(bigIntToBufferBE(R, curve.pointBytes));
  hash.update(bigIntToBufferBE(V, curve.pointBytes));
  hash.update(bigIntToBufferBE(Alpha, curve.pointBytes));
  hash.update(additionalCtx);

  return bigIntFromBufferBE(hash.digest());
}

/**
 * Verify a ZK Proof of knowledge of the s and l that are behind the public value V = sR + lG.
 * @param V The curve point V.
 * @param proof The ZK proof.
 * @param R The curve point R shared by all participants.
 * @param curve The elliptic curve.
 * @param additionalCtx Additional contextual information that is supposed to associate with the proof.
 * @returns True if the proof checks out.
 */
export function verifyZkVProof(
  V: bigint,
  proof: ZkVProof,
  R: bigint,
  curve: Curve,
  additionalCtx: Buffer = Buffer.from('')
): boolean {
  const c = nonInteractiveChallenge(V, R, proof.Alpha, curve, additionalCtx);

  const lhs = curve.pointAdd(curve.pointMultiply(R, proof.t), curve.basePointMult(proof.u));
  const rhs = curve.pointAdd(proof.Alpha, curve.pointMultiply(V, curve.scalarReduce(c)));

  return lhs === rhs;
}
