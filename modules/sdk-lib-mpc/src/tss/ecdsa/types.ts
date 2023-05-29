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

type PallierChallenge<T> = {
  p: T[];
};

type PallierChallengeProof<T> = {
  sigma: T[];
};

export type DeserializedPallierChallenge = PallierChallenge<bigint>;
export type SerializedPallierChallenge = PallierChallenge<string>;
export type DeserializedPallierChallengeProofs = PallierChallengeProof<bigint>;
export type SerializedPallierChallengeProofs = PallierChallengeProof<string>;
/**
 * The pallier proofs are done interactively between two parties.
 * If party A is completing a pallier proof $sigma$ with party B, then $p$ refers to
 * a challenge given to A by B, and $sigma$ represents the proof to the challenge
 */
export type DeserializedPallierChallengeWithProofs = DeserializedPallierChallenge & DeserializedPallierChallengeProofs;
export type SerializedPallierChallengeWithProofs = SerializedPallierChallenge & SerializedPallierChallengeProofs;

/**
 * Deserializes a pallier challenge to hex strings.
 * @param challenge
 */
export function deserializePallierChallenge(challenge: SerializedPallierChallenge): DeserializedPallierChallenge {
  return {
    p: convertHexArrToBigIntArr(challenge.p),
  };
}

/**
 * Deserializes a pallier challenge proof to hex strings.
 * @param challenge
 */
export function deserializePallierChallengeProofs(
  challenge: SerializedPallierChallengeProofs
): DeserializedPallierChallengeProofs {
  return {
    sigma: convertHexArrToBigIntArr(challenge.sigma),
  };
}

/**
 * Deserializes a pallier challenge and its proof to hex strings.
 * @param challengeWithProofs
 */
export function deserializePallierChallengeWithProofs(
  challengeWithProofs: SerializedPallierChallengeWithProofs
): DeserializedPallierChallengeWithProofs {
  return {
    p: deserializePallierChallenge(challengeWithProofs).p,
    sigma: deserializePallierChallengeProofs(challengeWithProofs).sigma,
  };
}

/**
 * Serializes a pallier challenge to hex strings.
 * @param challenge
 */
export function serializePallierChallenge(challenge: DeserializedPallierChallenge): SerializedPallierChallenge {
  return {
    p: convertBigIntArrToHexArr(challenge.p, 384),
  };
}

/**
 * Serializes a pallier challenge proof to hex strings.
 * @param challenge
 */
export function serializePallierChallengeProofs(
  challenge: DeserializedPallierChallengeProofs
): SerializedPallierChallengeProofs {
  return {
    sigma: convertBigIntArrToHexArr(challenge.sigma, 384),
  };
}

/**
 * Serializes a pallier challenge and its proof to hex strings.
 * @param challengeWithProofs
 */
export function serializePallierChallengeWithProofs(
  challengeWithProofs: DeserializedPallierChallengeWithProofs
): SerializedPallierChallengeWithProofs {
  return {
    ...serializePallierChallenge(challengeWithProofs),
    ...serializePallierChallengeProofs(challengeWithProofs),
  };
}

export type SerializedEcdsaChallenges = SerializedNtilde & SerializedPallierChallenge;

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
