import {
  FullySignedTransaction,
  HalfSignedAccountTransaction,
  PresignTransactionOptions as BasePresignTransactionOptions,
  Recipient,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionFee,
  TransactionParams,
  TransactionPrebuild as BaseTransactionPrebuild,
  VerifyTransactionOptions,
  Wallet,
} from '@bitgo/sdk-core';
import { TransactionPrebuild } from '@bitgo/sdk-coin-eth';

export interface PrecreateBitGoOptions {
  enterprise?: string;
  newFeeAddress?: string;
}

// For explainTransaction
export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  feeInfo: TransactionFee;
}

export interface AvaxcTransactionParams extends TransactionParams {
  gasPrice?: number;
  gasLimit?: number;
  hopParams?: HopParams;
  hop?: boolean;
}

export interface VerifyAvaxcTransactionOptions extends VerifyTransactionOptions {
  txPrebuild: TransactionPrebuild;
  txParams: AvaxcTransactionParams;
}

// For preSign
export interface PresignTransactionOptions extends TransactionPrebuild, BasePresignTransactionOptions {
  wallet: Wallet;
}

export interface EIP1559 {
  maxPriorityFeePerGas: number;
  maxFeePerGas: number;
}

// region Recovery
export interface UnformattedTxInfo {
  recipient: Recipient;
}

export interface OfflineVaultTxInfo {
  nextContractSequenceId?: string;
  contractSequenceId?: string;
  tx: string;
  userKey: string;
  backupKey: string;
  coin: string;
  gasPrice: number;
  gasLimit: number;
  recipients: Recipient[];
  walletContractAddress: string;
  amount: string;
  backupKeyNonce: number;
  eip1559?: EIP1559;
}
// endregion

// For createHopTransactionParams
export interface HopTransactionBuildOptions {
  wallet: Wallet;
  recipients: Recipient[];
  walletPassphrase: string;
}

// For getExtraPrebuildParams
export interface BuildOptions {
  hop?: boolean;
  wallet?: Wallet;
  recipients?: Recipient[];
  walletPassphrase?: string;
  [index: string]: unknown;
}

// For FeeEstimate
export interface FeeEstimate {
  gasLimitEstimate: number;
  feeEstimate: number;
}

/**
 * The extra parameters to send to platform build route for hop transactions
 */
export interface HopParams {
  hopParams: {
    gasPriceMax: number;
    userReqSig: string;
    paymentId: string;
  };
  gasLimit: number;
}

/**
 * The prebuilt hop transaction returned from the HSM
 */
export interface HopPrebuild {
  tx: string;
  id: string;
  signature: string;
  paymentId: string;
  gasPrice: number;
  gasLimit: number;
  amount: number;
  recipient: string;
  nonce: number;
  userReqSig: string;
  gasPriceMax: number;
}

// For txPreBuild
export interface TxInfo {
  recipients: Recipient[];
  from: string;
  txid: string;
}

export interface EthTransactionFee {
  fee: string;
  gasLimit?: string;
}

export interface TxPreBuild extends BaseTransactionPrebuild {
  halfSigned?: {
    expireTime: number;
    contractSequenceId: number;
    backupKeyNonce?: number;
    signature: string;
  };
  txHex: string;
  txInfo: TxInfo;
  feeInfo: EthTransactionFee;
  source: string;
  dataToSign: string;
  nextContractSequenceId?: string;
  expireTime?: number;
  hopTransaction?: string;
  eip1559?: EIP1559;
  userKey?: string;
  backupKey?: string;
  coin?: string;
  gasPrice?: string;
  gasLimit?: string;
  recipients?: Recipient[];
  walletContractAddress?: string;
  amount?: string;
  backupKeyNonce?: number;
  contractSequenceId?: string;
}

// For signTransaction
export interface SignFinalOptions {
  txPrebuild: TxPreBuild;
  signingKeyNonce: number;
  walletContractAddress: string;
  // nextContractSequenceId?: number;
  // hopTransaction?: string;
  // backupKeyNonce?: number;
  // isBatch?: boolean;
  txHex?: string;
  // expireTime?: number;
  prv: string;
  recipients: Recipient[];
}

export interface AvaxSignTransactionOptions extends BaseSignTransactionOptions, SignFinalOptions {
  prv: string;
  custodianTransactionId?: string;
  isLastSignature?: boolean;
}

export interface HalfSignedTransaction extends HalfSignedAccountTransaction {
  halfSigned: {
    txHex?: never;
    recipients: Recipient[];
    expiration?: number;
    eip1559?: EIP1559;
  };
}

export type SignedTransaction = HalfSignedTransaction | FullySignedTransaction;
