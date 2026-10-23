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
  /**
   * Non-canonical staking contracts to accept while re-parsing (e.g. a dummy pox-5), passed
   * explicitly so no shared/instance state is involved. Empty/omitted ⇒ canonical-only.
   */
  allowedStakingContracts?: ReadonlyArray<{ name: string; address: string }>;
}

export interface StxSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string | string[];
  pubKeys?: string[];
  numberSignature?: number;
  /** @see ExplainTransactionOptions.allowedStakingContracts */
  allowedStakingContracts?: ReadonlyArray<{ name: string; address: string }>;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  source: string;
}
