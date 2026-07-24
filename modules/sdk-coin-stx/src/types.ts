import {
  SignTransactionOptions,
  TransactionExplanation,
  TransactionPrebuild as BaseTransactionPrebuild,
} from '@bitgo/sdk-core';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SupplementGenerateWalletOptions {
  rootPrivateKey?: string;
}

export interface TransactionFee {
  fee: string;
}

export interface StxTransactionExplanation extends TransactionExplanation {
  memo?: string;
  type?: number;
  contractAddress?: string;
  contractName?: string;
  contractFunction?: string;
  contractFunctionArgs?: { type: string; value: string }[];
}

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  publicKeys?: string[];
  feeInfo: TransactionFee;
}

export interface StxSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string | string[];
  pubKeys?: string[];
  numberSignature?: number;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  source: string;
}
