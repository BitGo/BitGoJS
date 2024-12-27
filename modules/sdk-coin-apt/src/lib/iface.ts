import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType as BitGoTransactionType,
} from '@bitgo/sdk-core';

export enum AptTransactionType {
  Transfer = 'Transfer',
  TokenTransfer = 'TokenTransfer',
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: BitGoTransactionType;
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  sender: string;
  sequenceNumber: BigInt;
  maxGasAmount: BigInt;
  gasUnitPrice: BigInt;
  expirationTime: BigInt;
  payload: AptPayload;
  chainId: number;
}

export interface AptPayload {
  function: string;
  typeArguments: string[];
  arguments: string[];
  type: string;
}
