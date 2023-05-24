// Ntilde Proof where both alpha and t are a set of 128 proofs each.
import { bigIntToHex, convertBigIntArrToHexArr, convertHexArrToBigIntArr, hexToBigInt } from '../../util';

interface NtildeProof<T> {
  alpha: T[];
  t: T[];
}

// Ntilde Proof
interface NtildeProofs<T> {
  h1WrtH2: NtildeProof<T>;
  h2WrtH1: NtildeProof<T>;
}

// Ntilde challenge values
interface Ntilde<T> {
  ntilde: T;
  h1: T;
  h2: T;
}

export type DeserializedNtilde = Ntilde<bigint>;
/**
 * Deserializes a challenge from hex strings to bigint
 * @param challenge
 */
export function deserializeNtilde(challenge: SerializedNtilde): DeserializedNtilde {
  return {
    ntilde: hexToBigInt(challenge.ntilde),
    h1: hexToBigInt(challenge.h1),
    h2: hexToBigInt(challenge.h2),
  };
}

export type DeserializedNtildeProof = NtildeProof<bigint>;
export type DeserializedNtildeProofs = NtildeProofs<bigint>;
export type DeserializedNtildeWithProofs = DeserializedNtilde & {
  ntildeProof: DeserializedNtildeProofs;
};

/**
 * Deserializes a challenge and it's proofs from hex strings to bigint
 * @param challenge
 */
export function deserializeNtildeWithProofs(challenge: SerializedNtildeWithProofs): DeserializedNtildeWithProofs {
  return {
    ...deserializeNtilde(challenge),
    ntildeProof: {
      h1WrtH2: {
        alpha: convertHexArrToBigIntArr(challenge.ntildeProof.h1WrtH2.alpha),
        t: convertHexArrToBigIntArr(challenge.ntildeProof.h1WrtH2.t),
      },
      h2WrtH1: {
        alpha: convertHexArrToBigIntArr(challenge.ntildeProof.h2WrtH1.alpha),
        t: convertHexArrToBigIntArr(challenge.ntildeProof.h2WrtH1.t),
      },
    },
  };
}

export type SerializedNtilde = Ntilde<string>;

/**
 * Serializes a challenge from big int to hex strings.
 * @param challenge
 */
export function serializeNtilde(challenge: DeserializedNtilde): SerializedNtilde {
  return {
    ntilde: bigIntToHex(challenge.ntilde),
    h1: bigIntToHex(challenge.h1),
    h2: bigIntToHex(challenge.h2),
  };
}

export type SerializedNtildeProof = NtildeProof<string>;
export type SerializedNtildeProofs = NtildeProofs<string>;
export type SerializedNtildeWithProofs = SerializedNtilde & {
  ntildeProof: SerializedNtildeProofs;
};

/**
 * Serializes a challenge and it's proofs from big int to hex strings.
 * @param challenge
 */
export function serializeNtildeWithProofs(challenge: DeserializedNtildeWithProofs): SerializedNtildeWithProofs {
  return {
    ...serializeNtilde(challenge),
    ntildeProof: {
      h1WrtH2: {
        alpha: convertBigIntArrToHexArr(challenge.ntildeProof.h1WrtH2.alpha),
        t: convertBigIntArrToHexArr(challenge.ntildeProof.h1WrtH2.t),
      },
      h2WrtH1: {
        alpha: convertBigIntArrToHexArr(challenge.ntildeProof.h2WrtH1.alpha),
        t: convertBigIntArrToHexArr(challenge.ntildeProof.h2WrtH1.t),
      },
    },
  };
}

export interface RSAModulus {
  n: bigint;
  // Sophie Germain primes.
  q1: bigint;
  q2: bigint;
}

// Range proof values
export interface RangeProof {
  z: bigint;
  u: bigint;
  w: bigint;
  s: bigint;
  s1: bigint;
  s2: bigint;
}

// Range proof values
export interface RangeProofWithCheck {
  z: bigint;
  zprm: bigint;
  t: bigint;
  v: bigint;
  w: bigint;
  s: bigint;
  s1: bigint;
  s2: bigint;
  t1: bigint;
  t2: bigint;
  u: bigint;
}
