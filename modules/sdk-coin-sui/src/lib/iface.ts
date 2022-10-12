import { TransactionExplanation as BaseTransactionExplanation, TransactionType } from '@bitgo/sdk-core';
import { SuiObjectRef } from './transaction';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export interface PayTx {
  coins: SuiObjectRef[];
  recipients: string[];
  amounts: number[];
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id?: string;
  gasBudget: number;
  gasPrice: number;
  payTx: PayTx;
  sender: string;
  gasPayment: SuiObjectRef;
}
