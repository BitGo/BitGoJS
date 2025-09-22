import { KeyType } from '@near-js/crypto';
import { TransactionType, TransactionExplanation as BaseTransactionExplanation } from '@bitgo-beta/sdk-core';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export interface Signature {
  keyType: KeyType;
  data: Uint8Array;
}

export interface Transfer {
  deposit: bigint;
}

/** Interface with parameters needed to perform  FunctionCall to a contract */
export interface FunctionCall {
  methodName: string;
  args: Record<string, unknown>;
  gas: string;
  deposit: string;
}

/**
 * Actions implemented on Near account-lib
 * add here as more are implemented.
 */
export interface Action {
  transfer?: Transfer;
  functionCall?: FunctionCall;
}

export interface TxData {
  id?: string;
  signerId: string;
  publicKey?: string;
  nonce: bigint;
  receiverId: string;
  actions: Action[];
  signature?: Signature;
}

export interface StorageDepositInput {
  deposit: bigint;
  gas: bigint;
  accountId?: string;
}
