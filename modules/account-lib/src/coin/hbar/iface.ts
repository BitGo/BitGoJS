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
  tokenName?: string;
}

export interface HederaNode {
  nodeId: string;
}

export interface SignatureData {
  signature: string;
  keyPair: KeyPair;
}

export interface AddressDetails {
  address: string;
  memoId?: string;
}

export interface Recipient {
  address: string; // The address to transfer funds to
  amount: string; // Amount to transfer in tinyBars (there are 100,000,000 tinyBars in one Hbar)
  tokenName?: string; // token name if it's a token transfer
}
