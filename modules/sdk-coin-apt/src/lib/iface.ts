import { ITransactionExplanation, TransactionFee } from '@bitgo/sdk-core';

export type TransactionExplanation = ITransactionExplanation<TransactionFee>;

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  sender: string;
  sequenceNumber: bigint;
  maxGasAmount: bigint;
  gasUnitPrice: bigint;
  expirationTime: bigint;
  payload: AptPayload;
  chainId: number;
}

export interface AptPayload {
  function: string;
  typeArguments: string[];
  arguments: string[];
  type: string;
}
