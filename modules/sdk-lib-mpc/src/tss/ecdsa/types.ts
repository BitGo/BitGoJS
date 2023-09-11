import {
  bigIntToHex,
  convertBigIntArrToHexArr,
  convertHexArrToBigIntArr,
  hexToBigInt,
  hexToSignedBigInt,
  signedBigIntToHex,
} from '../../util';

// Ntilde Proof where both alpha and t are a set of 128 proofs each.
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

type paillierBlumProof<T> = {
  w: T;
  x: T[];
  z: T[];
};

export type SerializedPaillierBlumProof = paillierBlumProof<string>;
export type DeserializedPaillierBlumProof = paillierBlumProof<bigint>;

/**
 * Deserializes a paillier challenge and its proof from hex strings to big ints.
 * @param paillierBlumProof
 */
export function deserializePaillierBlumProof(
  paillierBlumProof: SerializedPaillierBlumProof
): DeserializedPaillierBlumProof {
  return {
    w: hexToBigInt(paillierBlumProof.w),
    x: convertHexArrToBigIntArr(paillierBlumProof.x),
    z: convertHexArrToBigIntArr(paillierBlumProof.z),
  };
}

/**
 * Serializes a paillier challenge and its proof to hex strings.
 * @param paillierBlumProof
 */
export function serializePaillierBlumProof(
  paillierBlumProof: DeserializedPaillierBlumProof
): SerializedPaillierBlumProof {
  return {
    w: bigIntToHex(paillierBlumProof.w, 768),
    x: convertBigIntArrToHexArr(paillierBlumProof.x, 768),
    z: convertBigIntArrToHexArr(paillierBlumProof.z, 768),
  };
}

export type RawPaillierKey = {
  // public modulus
  n: bigint;
  // private fields
  lambda: bigint;
  mu: bigint;
  p: bigint;
  q: bigint;
};

export type DeserializedKeyPairWithPaillierBlumProof = DeserializedPaillierBlumProof & RawPaillierKey;

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

type noSmallFactorsProof<T> = {
  P: T;
  Q: T;
  A: T;
  B: T;
  T: T;
  sigma: T;
  z1: T;
  z2: T;
  w1: T;
  w2: T;
  v: T;
};

export type SerializedNoSmallFactorsProof = noSmallFactorsProof<string>;
export type DeserializedNoSmallFactorsProof = noSmallFactorsProof<bigint>;

/**
 * Deserializes a Pi^fac proof from hex strings to big ints.
 * @param noSmallFactorsProof
 */
export function deserializeNoSmallFactorsProof(
  noSmallFactorsProof: SerializedNoSmallFactorsProof
): DeserializedNoSmallFactorsProof {
  return {
    P: hexToSignedBigInt(noSmallFactorsProof.P),
    Q: hexToSignedBigInt(noSmallFactorsProof.Q),
    A: hexToSignedBigInt(noSmallFactorsProof.A),
    B: hexToSignedBigInt(noSmallFactorsProof.B),
    T: hexToSignedBigInt(noSmallFactorsProof.T),
    sigma: hexToSignedBigInt(noSmallFactorsProof.sigma),
    z1: hexToSignedBigInt(noSmallFactorsProof.z1),
    z2: hexToSignedBigInt(noSmallFactorsProof.z2),
    w1: hexToSignedBigInt(noSmallFactorsProof.w1),
    w2: hexToSignedBigInt(noSmallFactorsProof.w2),
    v: hexToSignedBigInt(noSmallFactorsProof.v),
  };
}

/**
 * Serializes a Pi^fac proof to hex strings.
 * @param noSmallFactorsProof
 */
export function serializeNoSmallFactorsProof(
  noSmallFactorsProof: DeserializedNoSmallFactorsProof
): SerializedNoSmallFactorsProof {
  return {
    P: signedBigIntToHex(noSmallFactorsProof.P, 2 * (1 + 384)),
    Q: signedBigIntToHex(noSmallFactorsProof.Q, 2 * (1 + 384)),
    A: signedBigIntToHex(noSmallFactorsProof.A, 2 * (1 + 384)),
    B: signedBigIntToHex(noSmallFactorsProof.B, 2 * (1 + 384)),
    T: signedBigIntToHex(noSmallFactorsProof.T, 2 * (1 + 384)),
    sigma: signedBigIntToHex(noSmallFactorsProof.sigma, 2 * (2 * 384 + 256 / 8)),
    z1: signedBigIntToHex(noSmallFactorsProof.z1, 2 * (1 + 384 / 2 + (256 + 2 * 256) / 8)),
    z2: signedBigIntToHex(noSmallFactorsProof.z2, 2 * (1 + 384 / 2 + (256 + 2 * 256) / 8)),
    w1: signedBigIntToHex(noSmallFactorsProof.w1, 2 * (1 + (256 + 2 * 256) / 8)),
    w2: signedBigIntToHex(noSmallFactorsProof.w2, 2 * (1 + (256 + 2 * 256) / 8)),
    v: signedBigIntToHex(noSmallFactorsProof.v, 2 * (1 + 384 * 2 + (256 + 2 * 256) / 8)),
  };
}
