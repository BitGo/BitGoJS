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

export type DeserializedNtildeProof = NtildeProof<bigint>;
export type DeserializedNtildeProofs = NtildeProofs<bigint>;
export type DeserializedNtilde = Ntilde<bigint>;
export type DeserializedNtildeWithProofs = DeserializedNtilde & {
  ntildeProof: DeserializedNtildeProofs;
};

export type SerializedNtildeProof = NtildeProof<string>;
export type SerializedNtildeProofs = NtildeProofs<string>;
export type SerializedNtilde = Ntilde<string>;
export type SerializedNtildeWithProofs = SerializedNtilde & {
  ntildeProof: SerializedNtildeProofs;
};

export interface RSAModulus {
  n: bigint;
  // Sophie Germain primes.
  q1: bigint;
  q2: bigint;
}

// Range proof values
export type RangeProof = {
  z: bigint;
  u: bigint;
  w: bigint;
  s: bigint;
  s1: bigint;
  s2: bigint;
};

// Range proof values
export type RangeProofWithCheck = RangeProof & {
  zprm: bigint;
  t: bigint;
  v: bigint;
  t1: bigint;
  t2: bigint;
};
