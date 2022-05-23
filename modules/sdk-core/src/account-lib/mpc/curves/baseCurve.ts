/**
 * Base Interface for supporting elliptic curve parameters
 */

interface BaseCurve {
  // Function that reduces a scalar modulo the order of the
  // curve.
  scalarReduce(s: bigint): bigint;
  // Function that returns the negated field element modulo
  // the order of the curve.
  scalarNegate(s: bigint): bigint;
  // Function that returns the modular multiplicative inverse
  // of a field element.
  scalarInvert(s: bigint): bigint;
  // Function that returns a random field element.
  scalarRandom(): bigint;
  //  Function that returns the sum of two field elements modulo
  //  the order of the curve.
  scalarAdd(x: bigint, y: bigint): bigint;
  // Function that returns the difference of two field elements
  // modulo the order of the curve.
  scalarSub(x: bigint, y: bigint): bigint;
  // Function that returns the product of two field elements
  // modulo the order of the curve.
  scalarMult(x: bigint, y: bigint): bigint;
  // Function that multiplies a group element by a field element.
  basePointMult(n: bigint): bigint;
  // Function that adds two group elements.
  pointAdd(p: bigint, q: bigint): bigint;
  // Function that verifies a signature.
  verify(y: bigint, signedMessage: Buffer): Buffer;
}

export default BaseCurve;
