// Ntilde Proof where both alpha and t are a set of 128 proofs each.
import { SchnorrProof } from '../../types';
import { bigIntToHex, convertBigIntArrToHexArr, convertHexArrToBigIntArr, hexToBigInt } from '../../util';

// Private XShare of the current participant
export type XShare = {
  i: number;
  l: string;
  m: string;
  n: string;
  y: string; // combined public key
  x: string; // combined secret
  schnorrProofX: SchnorrProof; // schnorr proof of knowledge of x
  chaincode: string;
};

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
export type SerializedNtilde = Ntilde<string>;
export type DeserializedNtildeProof = NtildeProof<bigint>;
export type SerializedNtildeProof = NtildeProof<string>;
export type DeserializedNtildeProofs = NtildeProofs<bigint>;
export type SerializedNtildeProofs = NtildeProofs<string>;

/**
 * The ntilde proofs are done non-interactively,
 * therefore a party generates both ntilde, h1, h2 and the proofs without
 * interaction with the other party.
 */
export type DeserializedNtildeWithProofs = DeserializedNtilde & {
  ntildeProof: DeserializedNtildeProofs;
};
export type SerializedNtildeWithProofs = SerializedNtilde & {
  ntildeProof: SerializedNtildeProofs;
};

export type SerializedEcdsaChallenges = SerializedNtilde & SerializedPaillierChallenge;

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

type PaillierChallenge<T> = {
  p: T[];
};

type PaillierChallengeProof<T> = {
  sigma: T[];
};

export type DeserializedPaillierChallenge = PaillierChallenge<bigint>;
export type SerializedPaillierChallenge = PaillierChallenge<string>;
export type DeserializedPaillierChallengeProofs = PaillierChallengeProof<bigint>;
export type SerializedPaillierChallengeProofs = PaillierChallengeProof<string>;
/**
 * The paillier proofs are done interactively between two parties.
 * If party A is completing a paillier proof $sigma$ with party B, then $p$ refers to
 * a challenge given to A by B, and $sigma$ represents the proof to the challenge
 */
export type DeserializedPaillierChallengeWithProofs = DeserializedPaillierChallenge &
  DeserializedPaillierChallengeProofs;
export type SerializedPaillierChallengeWithProofs = SerializedPaillierChallenge & SerializedPaillierChallengeProofs;

/**
 * Deserializes a paillier challenge to hex strings.
 * @param challenge
 */
export function deserializePaillierChallenge(challenge: SerializedPaillierChallenge): DeserializedPaillierChallenge {
  return {
    p: convertHexArrToBigIntArr(challenge.p),
  };
}

/**
 * Deserializes a paillier challenge proof to hex strings.
 * @param challenge
 */
export function deserializePaillierChallengeProofs(
  challenge: SerializedPaillierChallengeProofs
): DeserializedPaillierChallengeProofs {
  return {
    sigma: convertHexArrToBigIntArr(challenge.sigma),
  };
}

/**
 * Deserializes a paillier challenge and its proof to hex strings.
 * @param challengeWithProofs
 */
export function deserializePaillierChallengeWithProofs(
  challengeWithProofs: SerializedPaillierChallengeWithProofs
): DeserializedPaillierChallengeWithProofs {
  return {
    ...deserializePaillierChallenge(challengeWithProofs),
    ...deserializePaillierChallengeProofs(challengeWithProofs),
  };
}

/**
 * Serializes a paillier challenge to hex strings.
 * @param challenge
 */
export function serializePaillierChallenge(challenge: DeserializedPaillierChallenge): SerializedPaillierChallenge {
  return {
    p: convertBigIntArrToHexArr(challenge.p, 768),
  };
}

/**
 * Serializes a paillier challenge proof to hex strings.
 * @param challenge
 */
export function serializePaillierChallengeProofs(
  challenge: DeserializedPaillierChallengeProofs
): SerializedPaillierChallengeProofs {
  return {
    sigma: convertBigIntArrToHexArr(challenge.sigma, 768),
  };
}

/**
 * Serializes a paillier challenge and its proof to hex strings.
 * @param challengeWithProofs
 */
export function serializePaillierChallengeWithProofs(
  challengeWithProofs: DeserializedPaillierChallengeWithProofs
): SerializedPaillierChallengeWithProofs {
  return {
    ...serializePaillierChallenge(challengeWithProofs),
    ...serializePaillierChallengeProofs(challengeWithProofs),
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

export interface ZkVProof {
  Alpha: bigint;
  t: bigint;
  u: bigint;
}
