import { TransactionFee } from '@bitgo/sdk-core';
import { ITransactionExplanation } from './transactionExplanation';

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  sender: string;
  destination: string;
  destinationAlias: string;
  amount: string;
  withdrawAmount: string;
  seqno: number;
  expirationTime: number;
  publicKey: string;
  signature: string;
  bounceable: boolean;
}

export type TransactionExplanation = ITransactionExplanation<TransactionFee>;
