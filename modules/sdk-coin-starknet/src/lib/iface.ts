import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType as BitGoTransactionType,
  TssVerifyAddressOptions,
} from '@bitgo/sdk-core';

export enum StarknetTransactionType {
  INVOKE = 'INVOKE',
  DEPLOY_ACCOUNT = 'DEPLOY_ACCOUNT',
}

export interface StarknetCall {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export interface StarknetResourceBounds {
  l2_gas: { max_amount: string; max_price_per_unit: string };
  l1_gas: { max_amount: string; max_price_per_unit: string };
  l1_data_gas: { max_amount: string; max_price_per_unit: string };
}

export interface StarknetTransactionData {
  senderAddress: string;
  calls: StarknetCall[];
  nonce: string;
  chainId: string;
  resourceBounds?: StarknetResourceBounds;
  transactionType: StarknetTransactionType;
  signature?: string[];
  transactionHash?: string;
  tip?: string;
  nonceDataAvailabilityMode?: number;
  feeDataAvailabilityMode?: number;
  compiledCalldata?: string[];
  /** DEPLOY_ACCOUNT: OZ EthAccount class hash. */
  classHash?: string;
  /** DEPLOY_ACCOUNT: constructor calldata (pubkey limbs). */
  constructorCalldata?: string[];
  /** DEPLOY_ACCOUNT: address salt derived from pubkey. */
  contractAddressSalt?: string;
  /** DEPLOY_ACCOUNT: deployed contract address (== senderAddress). Required by HSM firmware. */
  contractAddress?: string;
}

export interface InvokeTransactionHashParams {
  senderAddress: string;
  compiledCalldata: string[];
  chainId: string;
  nonce: string;
  resourceBounds: StarknetResourceBounds;
  tip?: string;
  nonceDataAvailabilityMode?: number;
  feeDataAvailabilityMode?: number;
  paymasterData?: string[];
  accountDeploymentData?: string[];
  proofFacts?: string[];
}

export interface DeployAccountTransactionHashParams {
  contractAddress: string;
  classHash: string;
  constructorCalldata: string[];
  contractAddressSalt: string;
  chainId: string;
  nonce: string;
  resourceBounds: StarknetResourceBounds;
  tip?: string;
  nonceDataAvailabilityMode?: number;
  feeDataAvailabilityMode?: number;
  paymasterData?: string[];
}

export interface ParsedTransferData {
  recipient: string;
  amount: string;
  tokenContract: string;
}

export interface TxData {
  id?: string;
  sender: string;
  senderPublicKey?: string;
  recipient?: string;
  amount?: string;
  fee?: string;
  nonce: string;
  type: BitGoTransactionType;
}

export interface StarknetTransactionExplanation extends BaseTransactionExplanation {
  sender?: string;
  type?: BitGoTransactionType;
}

export interface TransactionHexParams {
  transactionHex: string;
  signableHex?: string;
}

export interface TssVerifyStarknetAddressOptions extends TssVerifyAddressOptions {
  rootAddress?: string;
}
