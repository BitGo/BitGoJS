export type PublicKeychain = {
  // public key
  pk: bigint;
  chaincode: bigint;
};

export type PrivateKeychain = PublicKeychain & {
  // secret key
  sk: bigint;
  prefix?: bigint;
};

/**
 * An interface for calculating a subkey in an HD key scheme.
 */
export interface HDTree {
  publicDerive(keychain: PublicKeychain, path: string): PublicKeychain;

  privateDerive(keychain: PrivateKeychain, path: string): PrivateKeychain;
}

/**
 * Base Interface for supporting elliptic curve parameters
 */
export interface BaseCurve {
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
  // Multiply a point by a scalar.
  pointMultiply(p: bigint, s: bigint): bigint;
  // Function that verifies a signature.
  verify(message: Buffer, signature: Buffer, publicKey: bigint): boolean;
  // order of the curve
  order: () => bigint;
  // the size of scalar of the curve in bytes
  scalarBytes: number;
  // the size of point of the curve in bytes
  pointBytes: number;
}
