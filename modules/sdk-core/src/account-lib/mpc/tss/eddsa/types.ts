export interface UShare {
  i: number;
  t: number;
  n: number;
  y: string;
  seed: string;
  chaincode: string;
}

export interface YShare {
  i: number;
  j: number;
  y: string;
  v?: string;
  u: string;
  chaincode: string;
}

export interface KeyShare {
  uShare: UShare;
  yShares: Record<number, YShare>;
}

export interface PShare {
  i: number;
  t: number;
  n: number;
  y: string;
  u: string;
  prefix: string;
  chaincode: string;
}

export interface JShare {
  i: number;
  j: number;
}

export interface KeyCombine {
  pShare: PShare;
  jShares: Record<number, JShare>;
}

export interface SubkeyShare {
  pShare: PShare;
  yShares: Record<number, YShare>;
}

export interface XShare {
  i: number;
  y: string;
  u: string;
  r: string;
  R: string;
}

export interface RShare {
  i: number;
  j: number;
  u: string;
  v?: string;
  r: string;
  R: string;
}

export interface Commitment {
  c: string; // A commitment of $r_j$, where $c = r_j G$.
  z: string; // A commitment of the message being signed, $m$, where $z = H(m)$ and $H$ is a hash.
}

export interface ExchangeCommitmentResponse {
  commitment: string;
}

export interface SignShare {
  xShare: XShare;
  commitment: Commitment;
  rShare: RShare;
}

export interface GShare {
  i: number;
  y: string;
  gamma: string;
  R: string;
}

export interface Signature {
  y: string;
  R: string;
  sigma: string;
}
