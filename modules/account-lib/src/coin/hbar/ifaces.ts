import { Ed25519PublicKey, Ed25519PrivateKey } from '@hashgraph/sdk';
import { KeyPair } from '.';

export interface TxData {
  id: string;
  hash?: string;
  from: string;
  data: string;
  fee: number;
  startTime: string;
  validDuration: string;
  node: string;
  memo?: string;
  to?: string;
  amount?: string;
}

export interface HederaNode {
  nodeId: string;
}

export interface SignatureData {
  signature: string;
  keyPair: KeyPair;
}

export interface SDKKeyPair {
  pub: Ed25519PublicKey;
  prv?: Ed25519PrivateKey;
}

export interface Timestamp {
  seconds: number;
  nanos: number;
}

export interface AccountID {
  shardnum: number;
  realmnum: number;
  accountnum: number;
}
