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
  ntildeProof?: NtildeProofs<T>;
}

export type DeserializedNtildeProof = NtildeProof<bigint>;
export type DeserializedNtildeProofs = NtildeProofs<bigint>;
export type DeserializedNtilde = Ntilde<bigint>;
export type DeserializedNtildeWithProofs = Omit<DeserializedNtilde, 'ntildeProof'> & {
  ntildeProof: DeserializedNtildeProofs;
};

export type SerializedNtildeProof = NtildeProof<string>;
export type SerializedNtildeProofs = NtildeProofs<string>;
export type SerializedNtilde = Ntilde<string>;
export type SerializedNtildeWithProofs = Omit<SerializedNtilde, 'ntildeProof'> & {
  ntildeProof: SerializedNtildeProofs;
};

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

// Private share of the user generated during key generation
export interface PShare {
  i: number; // participant index
  t?: number; // threshold
  c?: number; // number of shares
  l: string; // lambda value for paillier secret key
  m: string; // mu value for paillier secret key
  u: string; // shamir share of secret
  uu: string; // unsplit shamir share of secret
  n: string; // n => (p . q) where p and q are the two random prime numbers chosen for paillier encryption
  y: string;
  chaincode: string;
}

// NShares which is shared to the other participants during key generation
export interface NShare {
  i: number; // participant index
  j: number; // target participant index
  n: string;
  u: string; // shamir share of secret at j'th index
  y: string;
  v?: string;
  chaincode: string;
}

export type KeyShare = {
  pShare: PShare;
  nShares: Record<number, NShare>;
};

// Private XShare of the current participant
export interface XShare {
  i: number;
  l: string;
  m: string;
  n: string;
  y: string; // combined public key
  x: string; // combined secret
  chaincode: string;
  p?: string[]; // paillier proof of correctness challenge
}

export type XShareWithNtilde = XShare & SerializedNtilde;

// YShares used during signature generation
export interface YShare {
  i: number;
  j: number;
  n: string;
  p?: string[]; // paillier proof of correctness challenge
}

export type YShareWithNtilde = YShare & SerializedNtilde;

export interface KeyCombined {
  xShare: XShare;
  yShares: Record<number, YShare>;
}

export interface KeyCombinedWithNtilde {
  xShare: XShareWithNtilde;
  yShares: Record<number, YShareWithNtilde>;
}

export interface SubkeyShare {
  xShare: XShare;
  nShares: Record<number, NShare>;
}

export interface WShare {
  i: number;
  l: string;
  m: string;
  n: string;
  y: string; // combined public key
  ntilde: string;
  h1: string;
  h2: string;
  p: Array<string>;
  ck: string;
  k: string;
  w: string;
  gamma: string;
}

export interface RangeProofShare {
  z: string;
  u: string;
  w: string;
  s: string;
  s1: string;
  s2: string;
}

export interface KShare {
  i: number;
  j: number;
  n: string;
  ntilde: string;
  h1: string;
  h2: string;
  p: Array<string>;
  sigma: Array<string>;
  k: string;
  proof: RangeProofShare;
}
export interface SignShareRT {
  wShare: WShare;
  kShare: KShare;
}

export interface RangeProofWithCheckShare {
  z: string;
  zprm: string;
  t: string;
  v: string;
  w: string;
  s: string;
  s1: string;
  s2: string;
  t1: string;
  t2: string;
  u: string;
  x: string;
}

// Alpha Share
export interface AShare {
  i: number;
  j: number;
  n: string;
  ntilde: string;
  h1: string;
  h2: string;
  sigma: Array<string>;
  k: string;
  alpha: string;
  mu: string;
  proof: RangeProofShare;
  gammaProof: RangeProofWithCheckShare;
  wProof: RangeProofWithCheckShare;
}

// Beta Share
export interface BShare extends WShare {
  gamma: string;
  beta: string;
  nu: string;
}

// Mu Share
export interface MUShare {
  i: number;
  j: number;
  alpha: string;
  mu: string;
  gammaProof: RangeProofWithCheckShare;
  wProof: RangeProofWithCheckShare;
}

// Gamma Share
export interface GShare {
  i: number;
  l?: string;
  m?: string;
  n: string;
  y: string; // combined public key
  k: string;
  w: string;
  gamma: string;
  alpha: string;
  mu: string;
  beta: string;
  nu: string;
}
export interface SignConvert {
  xShare?: XShare; // XShare of the current participant
  yShare?: YShare; // YShare corresponding to the other participant
  kShare?: KShare; // KShare received from the other participant
  bShare?: BShare; // Private Beta share of the participant
  muShare?: MUShare; // muShare received from the other participant
  aShare?: AShare;
  wShare?: WShare;
}

export interface SignConvertRT {
  aShare?: AShare;
  bShare?: BShare;
  muShare?: MUShare;
  gShare?: GShare;
}

export interface OShare {
  i: number;
  y: string;
  k: string;
  omicron: string;
  delta: string;
  Gamma: string;
}

export interface DShare {
  i: number;
  j: number;
  delta: string;
  Gamma: string;
}

export interface SShare {
  i: number;
  R: string;
  s: string;
  y: string;
}

export interface SignCombine {
  gShare: GShare;
  signIndex: {
    i: number;
    j: number;
  };
}

export interface SignCombineRT {
  oShare: OShare;
  dShare: DShare;
}

export interface Signature {
  y: string;
  recid: number;
  r: string;
  s: string;
}
