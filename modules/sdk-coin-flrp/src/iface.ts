import {
  SignTransactionOptions,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionRecipient,
  TransactionFee,
  VerifyTransactionOptions,
  TransactionParams,
} from '@bitgo/sdk-core';

export { TransactionFee };
export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  publicKeys?: string[];
}

export interface TxInfo {
  recipients: TransactionRecipient[];
  from: string;
  txid: string;
}

export interface FlrpSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string | string[];
  pubKeys?: string[];
}
export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  txInfo: TxInfo;
  source: string;
}
export interface FlrpTransactionStakingOptions {
  startTime: string;
  endTime: string;
  nodeID: string;
  amount: string;
  delegationFeeRate?: number;
}
export interface FlrpTransactionParams extends TransactionParams {
  type: string;
  stakingOptions: FlrpTransactionStakingOptions;
  locktime?: number;
  unspents?: string[];
  sourceChain?: string;
}

export interface FlrpVerifyTransactionOptions extends VerifyTransactionOptions {
  txParams: FlrpTransactionParams;
}
