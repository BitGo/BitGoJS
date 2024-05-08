import { EcdsaTypes, HashCommitDecommit, SchnorrProof } from '@bitgo/sdk-lib-mpc';

/**
 * @deprecated use DeserializedNtildeProof from sdk-lib-mpc instead
 */
export type DeserializedNtildeProof = EcdsaTypes.DeserializedNtildeProof;
/**
 * @deprecated use DeserializedNtildeProofs from sdk-lib-mpc instead
 */
export type DeserializedNtildeProofs = EcdsaTypes.DeserializedNtildeProofs;
/**
 * @deprecated use DeserializedNtildeProofs from sdk-lib-mpc instead
 */
export type DeserializedNtilde = EcdsaTypes.DeserializedNtilde;
/**
 * @deprecated use DeserializedNtildeWithProofs from sdk-lib-mpc instead
 */
export type DeserializedNtildeWithProofs = EcdsaTypes.DeserializedNtildeWithProofs;
/**
 * @deprecated use SerializedNtildeProof from sdk-lib-mpc instead
 */
export type SerializedNtildeProof = EcdsaTypes.SerializedNtildeProof;
/**
 * @deprecated use SerializedNtildeProofs from sdk-lib-mpc instead
 */
export type SerializedNtildeProofs = EcdsaTypes.SerializedNtildeProofs;
/**
 * @deprecated use SerializedNtilde from sdk-lib-mpc instead
 */
export type SerializedNtilde = EcdsaTypes.SerializedNtilde;
/**
 * @deprecated use SerializedNtildeWithProofs from sdk-lib-mpc instead
 */
export type SerializedNtildeWithProofs = EcdsaTypes.SerializedNtildeWithProofs;
/**
 * @deprecated use XShare from sdk-lib-mpc instead
 */
export type XShare = EcdsaTypes.XShare;

// Private share of the user generated during key generation
export type PShare = {
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
};

export type SignIndex = {
  i: number; // participant index
  j: number; // target participant index
};

// NShares which is shared to the other participants during key generation
export type NShare = SignIndex & {
  n: string;
  u: string; // shamir share of secret at j'th index
  y: string;
  v?: string;
  chaincode: string;
};

export type KeyShare = {
  pShare: PShare;
  nShares: Record<number, NShare>;
};

export type XShareWithChallenges = EcdsaTypes.XShare &
  EcdsaTypes.SerializedNtilde &
  EcdsaTypes.SerializedPaillierChallenge;

// YShares used during signature generation
export type YShare = SignIndex & {
  n: string;
};

export type YShareWithChallenges = YShare & EcdsaTypes.SerializedNtilde & EcdsaTypes.SerializedPaillierChallenge;

export interface KeyCombined {
  xShare: EcdsaTypes.XShare;
  yShares: Record<number, YShare>;
}

export type KeyCombinedWithNtilde = {
  xShare: XShareWithChallenges;
  yShares: Record<number, YShareWithChallenges>;
};

export type SubkeyShare = {
  xShare: EcdsaTypes.XShare;
  nShares: Record<number, NShare>;
};

export type WShare = EcdsaTypes.SerializedNtilde &
  EcdsaTypes.SerializedPaillierChallenge & {
    i: number;
    l: string;
    m: string;
    n: string;
    y: string; // combined public key
    ck: string;
    k: string;
    w: string;
    gamma: string;
  };

export type RangeProofShare = {
  z: string;
  u: string;
  w: string;
  s: string;
  s1: string;
  s2: string;
};

export type KShare = SignIndex &
  EcdsaTypes.SerializedNtilde &
  EcdsaTypes.SerializedPaillierChallenge &
  EcdsaTypes.SerializedPaillierChallengeProofs & {
    n: string;
    k: string;
    // TODO(BG-78713): this shouldn't be optional
    proof?: RangeProofShare;
  };

export type SignShareRT = {
  wShare: WShare;
  kShare: KShare;
};

export type RangeProofWithCheckShare = {
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
};

// Alpha Share
export type AShare = SignIndex &
  EcdsaTypes.SerializedNtilde &
  EcdsaTypes.SerializedPaillierChallengeProofs & {
    n: string;
    k: string;
    alpha: string;
    mu: string;
    // TODO(BG-78713): these shouldn't be optional
    proof?: RangeProofShare;
    gammaProof?: RangeProofWithCheckShare;
    wProof?: RangeProofWithCheckShare;
  };

// Beta Share
export type BShare = WShare & {
  beta: string;
  nu: string;
};

// Mu Share
export type MUShare = SignIndex & {
  alpha: string;
  mu: string;
  gammaProof: RangeProofWithCheckShare;
  wProof: RangeProofWithCheckShare;
};

// Gamma Share
export type GShare = {
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
};

export type SignConvert = {
  xShare?: XShareWithChallenges; // XShare of the current participant
  yShare?: YShare; // YShare corresponding to the other participant
  kShare?: KShare; // KShare received from the other participant
  bShare?: BShare; // Private Beta share of the participant
  muShare?: MUShare; // muShare received from the other participant
  aShare?: AShare;
  wShare?: WShare;
};

export type SignConvertStep1 = {
  xShare: XShareWithChallenges; // XShare of the current participant (does not get sent to other participant)
  yShare: YShare; // YShare corresponding to the other participant (does not get sent to other participant)
  kShare: KShare; // share to be modified and sent to other participant
};

export type SignConvertStep1Response = {
  bShare: BShare; // private participant share (does not get sent to other participant)
  aShare: AShare; // share to be sent to other participant
};

export type SignConvertStep2 = {
  wShare: WShare; // private participant share (does not get sent to other participant)
  aShare: AShare; // share to be modified and sent to other participant
};

export type SignConvertStep2Response = {
  gShare: GShare; // private participant share (does not get sent to other participant)
  muShare: MUShare; // share to be sent to other participant
};

export type SignConvertStep3 = {
  bShare: BShare; // private participant share (does not get sent to other participant)
  muShare: MUShare; // share to be modified and sent to other participant
};

export type SignConvertStep3Response = {
  gShare: GShare; // participant share
  signIndex: SignIndex;
};

export type SignConvertRT = {
  aShare?: AShare;
  bShare?: BShare;
  muShare?: MUShare;
  gShare?: GShare;
};

export type OShare = {
  i: number;
  y: string;
  k: string;
  omicron: string;
  delta: string;
  Gamma: string;
};

export type DShare = SignIndex & {
  delta: string;
  Gamma: string;
};

export type SShare = {
  i: number;
  R: string;
  s: string;
  y: string;
};

export type SignCombine = {
  gShare: GShare;
  signIndex: SignIndex;
};

export type SignCombineRT = {
  oShare: OShare;
  dShare: DShare;
};

export type Signature = {
  y: string;
  recid: number;
  r: string;
  s: string;
};

export interface PublicVAShare {
  V: bigint;
  A: bigint;
  comDecomVA: HashCommitDecommit;
}

export interface PublicVAShareWithProofs extends PublicVAShare, VAProofs {}

export interface VAShare extends SShare, PublicVAShare {
  m: Buffer;
  l: bigint;
  rho: bigint;
}

export interface VAProofs {
  zkVProofV: EcdsaTypes.ZkVProof;
  schnorrProofA: SchnorrProof;
}

export interface VAShareWithProofs extends VAShare, VAProofs {
  proofContext: Buffer;
}

export interface PublicUTShare {
  U: bigint;
  T: bigint;
  comDecomUT: HashCommitDecommit;
}

export interface UTShare extends SShare, PublicUTShare {}
