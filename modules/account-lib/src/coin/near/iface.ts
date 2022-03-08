import BN from 'bn.js';
import { TransactionType } from '../baseCoin';
import { TransactionExplanation as BaseTransactionExplanation } from '../baseCoin/iface';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export enum KeyType {
  ED25519 = 0,
}

export interface Signature {
  keyType: KeyType;
  data: Uint8Array;
}

export interface Transfer {
  deposit: BN;
}

export interface Action {
  // TODO: add actions when they are implemented
  transfer: Transfer;
}

export interface TxData {
  id?: string;
  signerId: string;
  publicKey: string;
  nonce: number;
  receiverId: string;
  actions: Action[];
  signature?: Signature;
}
