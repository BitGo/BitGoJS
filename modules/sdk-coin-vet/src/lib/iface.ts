import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType as BitGoTransactionType,
} from '@bitgo/sdk-core';

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
}

export interface VetTransactionExplanation extends BaseTransactionExplanation {
  sender?: string;
  type?: BitGoTransactionType;
}
