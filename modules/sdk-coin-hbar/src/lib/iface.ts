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
  /** @deprecated Use instructionsData.params.recipients instead */
  to?: string;
  /** @deprecated Use instructionsData.params.recipients instead */
  amount?: string;
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
