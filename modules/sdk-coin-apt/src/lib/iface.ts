import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionRecipient,
  TransactionType as BitGoTransactionType,
} from '@bitgo/sdk-core';

export interface AptTransactionExplanation extends BaseTransactionExplanation {
  sender?: string;
  type?: BitGoTransactionType;
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  sender: string;
  recipient: TransactionRecipient;
  sequenceNumber: number;
  maxGasAmount: number;
  gasUnitPrice: number;
  gasUsed: number;
  expirationTime: number;
  feePayer: string;
  assetId: string;
}
