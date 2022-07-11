import { KeyPair } from '.';
import { HederaTransactionTypes } from './constants';

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
  to?: string; // TODO: [BG-51282] Deprecate once wp work for multi recipients
  amount?: string;
  tokenName?: string;
  instructionsData?: InstructionParams;
}

export interface Recipient {
  address: string;
  amount: string;
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

export type InstructionParams = Transfer | AssociateAccount;

export interface Transfer {
  type: HederaTransactionTypes.Transfer;
  params: {
    tokenName?: string;
    recipients: Recipient[];
  };
}

export interface AssociateAccount {
  type: HederaTransactionTypes.TokenAssociateToAccount;
  params: {
    accountId: string;
    tokenNames: string[];
  };
}
