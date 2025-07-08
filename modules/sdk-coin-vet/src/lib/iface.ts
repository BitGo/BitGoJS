import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType as BitGoTransactionType,
  TransactionRecipient,
} from '@bitgo/sdk-core';

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface VetTransactionData {
  id: string;
  chainTag: number;
  blockRef: string;
  expiration: number;
  gasPriceCoef: number;
  gas: number;
  dependsOn: string | null;
  nonce: number;
  sender?: string;
  feePayer?: string;
  recipients?: TransactionRecipient[];
  data?: string;
  value?: string;
  deployedAddress?: string;
  to?: string;
  tokenAddress?: string;
}

export interface VetTransactionExplanation extends BaseTransactionExplanation {
  sender?: string;
  type?: BitGoTransactionType;
}
