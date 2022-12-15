import { TransactionExplanation as BaseTransactionExplanation, TransactionType } from '@bitgo/sdk-core';
import { SuiTransactionType } from './constants';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export type SuiObjectRef = {
  /** Hex code as string representing the object id */
  objectId: string;
  /** Object version */
  version: number;
  /** Base64 string representing the object digest */
  digest: string;
};

export type TxDetails = PayTxDetails | PaySuiTxDetails | PayAllSuiTxDetails;

export interface PayTxDetails {
  Pay: {
    coins: SuiObjectRef[];
    recipients: string[];
    amounts: number[];
  };
}

export interface PaySuiTxDetails {
  PaySui: {
    coins: SuiObjectRef[];
    recipients: string[];
    amounts: number[];
  };
}

export interface PayAllSuiTxDetails {
  PayAllSui: {
    coins: SuiObjectRef[];
    recipient: string;
  };
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id?: string;
  kind: { Single: TxDetails };
  sender: string;
  gasPayment: SuiObjectRef;
  gasBudget: number;
  gasPrice: number;
}

export interface PayTx {
  coins: SuiObjectRef[];
  recipients: string[];
  amounts: number[];
}

export interface SuiTransaction {
  type: SuiTransactionType;
  sender: string;
  payTx: PayTx;
  gasBudget: number;
  gasPrice: number;
  gasPayment: SuiObjectRef;
}
