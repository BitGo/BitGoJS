import algosdk from 'algosdk';

export interface TxData {
  id: string;
  type?: string;
  from: string;
  to?: string;
  fee: number;
  amount?: string;
  firstRound: number;
  lastRound: number;
  note?: Uint8Array;
  voteKey?: string;
  selectionKey?: string;
  voteFirst?: number;
  voteLast?: number;
  voteKeyDilution?: number;
  stateProofKey?: string;
  tokenId?: number;
  genesisID: string;
  genesisHash: string | Buffer;
  closeRemainderTo?: string;
  nonParticipation?: boolean;
  txType?: string;
  tokenName?: string;
}

export interface Address {
  publicKey: Uint8Array;
  checksum: Uint8Array;
}

export interface Seed {
  seed: Uint8Array;
  checksum: Uint8Array;
}

export interface EncodedTx {
  rawTransaction: Uint8Array;
  txn: algosdk.Transaction;
  signed: boolean;
  signers?: string[];
  signedBy?: string[];
}

export interface Account {
  addr: string;
  sk: Uint8Array;
}
