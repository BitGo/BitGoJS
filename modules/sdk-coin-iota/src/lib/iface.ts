import {
  ParseTransactionOptions as BaseParseTransactionOptions,
  TransactionExplanation as BaseTransactionExplanation,
  TransactionRecipient,
  TransactionType as BitGoTransactionType,
  TransactionType,
} from '@bitgo/sdk-core';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: BitGoTransactionType;
  sender: string;
  sponsor?: string;
}

export type TransactionObjectInput = {
  objectId: string;
  version: string;
  digest: string;
};

export type GasData = {
  gasBudget?: number;
  gasPrice?: number;
  gasPaymentObjects?: TransactionObjectInput[];
};

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id?: string;
  sender: string;
  gasBudget?: number;
  gasPrice?: number;
  gasPaymentObjects?: TransactionObjectInput[];
  gasSponsor?: string;
  type: TransactionType;
}

export interface TransferTxData extends TxData {
  recipients: TransactionRecipient[];
  paymentObjects?: TransactionObjectInput[];
}

export interface ExplainTransactionOptions {
  txBase64: string;
}

export interface IotaParseTransactionOptions extends BaseParseTransactionOptions {
  txBase64: string;
}
