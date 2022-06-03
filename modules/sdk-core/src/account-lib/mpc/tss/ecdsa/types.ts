// Private share of the user generated during key generation
export interface PShare {
  i: number; // participant index
  l: string; // lambda value for paillier secret key
  m: string; // mu value for paillier secret key
  u: string; // shamir share of secret
  n: string; // n => (p . q) where p and q are the two random prime numbers chosen for paillier encryption
  y: string;
}

// NShares which is shared to the other participants during key generation
export interface NShare {
  i: number; // participant index
  j: number; // target participant index
  n: string;
  u: string; // shamir share of secret at j'th index
  y: string;
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
