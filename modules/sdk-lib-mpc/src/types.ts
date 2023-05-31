export interface HashCommitDecommit {
  commitment: Buffer;
  decommitment: HashDecommitment;
}

export interface HashDecommitment {
  secret: Buffer;
  blindingFactor: Buffer;
}

export interface SchnorrProof {
  vPoint: bigint;
  r: bigint;
}
