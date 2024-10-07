import {
  InitiateRecoveryOptions as BaseInitiateRecoveryOptions,
  SignTransactionOptions as BaseSignTransactionOptions,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  TransactionExplanation,
  TransactionPrebuild,
} from '@bitgo/sdk-core';

export interface Address {
  address: string;
  destinationTag?: number;
}

export interface FeeInfo {
  date: string;
  height: number;
  baseReserve: string;
  baseFee: string;
}

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
  isLastSignature?: boolean;
}

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string; // txHex is poorly named here; it is just a wrapped JSON object
  };
}

export interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  rootAddress: string;
}

export interface RecoveryInfo extends TransactionExplanation {
  txHex: string;
  backupKey?: string;
  coin?: string;
}

export interface RecoveryTransaction {
  txHex: string;
}

export interface InitiateRecoveryOptions extends BaseInitiateRecoveryOptions {
  krsProvider?: string;
}

export interface RecoveryOptions {
  backupKey: string;
  userKey: string;
  rootAddress: string;
  recoveryDestination: string;
  bitgoKey?: string;
  walletPassphrase: string;
  krsProvider?: string;
}

export interface HalfSignedTransaction {
  halfSigned: {
    txHex: string;
  };
}

export interface SupplementGenerateWalletOptions {
  rootPrivateKey?: string;
}
