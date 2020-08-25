import { Ed25519PublicKey, Ed25519PrivateKey } from '@hashgraph/sdk';
import { TransactionBody } from '@hashgraph/sdk/lib/generated/TransactionBody_pb';
import { SignatureList, SignatureMap } from '@hashgraph/sdk/lib/generated/BasicTypes_pb';
import { KeyPair } from '.';

export interface TxData {
  sigs?: SignatureList.AsObject;
  sigmap?: SignatureMap.AsObject;
  body: TransactionBody.AsObject;
  bodybytes: Uint8Array | string;
  hash?: string;
}

export interface HederaNode {
  nodeId: string;
}

export interface SignatureData {
  signature: string;
  keyPair: KeyPair;
}

export interface HbarKeyPair {
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
