import {
  ParsedTransaction,
  ParseTransactionOptions as BaseParseTransactionOptions,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation,
} from '@bitgo/sdk-core';

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  key: string;
  blockHash: string;
  nonce: number;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface VerifiedTransactionParameters {
  txHex: string;
  prv: string;
  signer: string;
}

export interface NearParseTransactionOptions extends BaseParseTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface TransactionOutput {
  address: string;
  amount: string;
}

export interface RecoveryOptions {
  userKey: string; // Box A
  backupKey: string; // Box B
  bitgoKey: string; // Box C
  recoveryDestination: string;
  krsProvider?: string;
  walletPassphrase: string;
  startingScanIndex?: number;
  scan?: number;
}

export interface NearTx {
  serializedTx: string;
  scanIndex: number;
}

export interface NearTxBuilderParamsFromNode {
  nonce: number;
  blockHash: string;
}

export interface NearFeeConfig {
  sendSir: number;
  sendNotSir: number;
  execution: number;
}

export interface ProtocolConfigOutput {
  storageAmountPerByte: number;
  transferCost: NearFeeConfig;
  receiptConfig: NearFeeConfig;
}

type TransactionInput = TransactionOutput;

export interface NearParsedTransaction extends ParsedTransaction {
  // total assets being moved, including fees
  inputs: TransactionInput[];

  // where assets are moved to
  outputs: TransactionOutput[];
}

export type NearTransactionExplanation = TransactionExplanation;
