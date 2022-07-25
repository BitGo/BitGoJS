// Private share of the user generated during key generation
export interface PShare {
  i: number; // participant index
  l: string; // lambda value for paillier secret key
  m: string; // mu value for paillier secret key
  u: string; // shamir share of secret
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
}

// YShares used during signature generation
export interface YShare {
  i: number;
  j: number;
  n: string;
}

export interface KeyCombined {
  xShare: XShare;
  yShares: Record<number, YShare>;
}

export interface WShare {
  i: number;
  l: string;
  m: string;
  n: string;
  y: string; // combined public key
  k: string;
  w: string;
  gamma: string;
}

export interface KShare {
  i: number;
  j: number;
  n: string;
  k: string;
}
export interface SignShareRT {
  wShare: WShare;
  kShare: KShare;
}

// Alpha Share
export interface AShare {
  i: number;
  j: number;
  n?: string;
  k?: string;
  alpha?: string;
  mu?: string;
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
  y: string;
  r: string;
  s: string;
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
  r: string;
  s: string;
}

export interface SignRT {
  i: number;
  y: string;
  r: string;
  s: string;
}
