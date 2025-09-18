// Type definitions for Flare P-chain transaction builders
// Replaces loose 'any' types with proper type safety

import { DecodedUtxoObj } from './iface';

/**
 * Base extended transaction interface with common optional properties
 */
export interface BaseExtendedTransaction {
  _memo?: Uint8Array;
  _outputAmount?: string;
  _utxos?: DecodedUtxoObj[];
}

/**
 * Extended transaction for staking transactions (delegator/validator)
 */
export interface StakingExtendedTransaction extends BaseExtendedTransaction {
  _rewardAddresses: string[]; // Required for all staking transactions
  _nodeID?: string;
  _startTime?: bigint;
  _endTime?: bigint;
  _stakeAmount?: bigint;
}

/**
 * Extended transaction for validator transactions
 */
export interface ValidatorExtendedTransaction extends StakingExtendedTransaction {
  _delegationFeeRate?: number;
}

/**
 * Extended transaction for permissionless validator transactions
 */
export interface PermissionlessValidatorExtendedTransaction extends ValidatorExtendedTransaction {
  _blsPublicKey?: string;
  _blsSignature?: string;
}

/**
 * Base raw transaction data structure from serialized transactions
 */
export interface BaseRawTransactionData {
  // Optional fields common to all transaction types
  memo?: Uint8Array | string;
  utxos?: DecodedUtxoObj[];
  outputAmount?: string;
  networkID?: number;
  blockchainID?: Buffer | string;
}

/**
 * Raw transaction data for delegator transactions
 */
export interface DelegatorRawTransactionData extends BaseRawTransactionData {
  // Required fields for delegator transactions
  nodeID: string;
  startTime: string | number | bigint;
  endTime: string | number | bigint;
  stakeAmount: string | number | bigint;
  rewardAddresses: string[];
}

/**
 * Raw transaction data for validator transactions
 */
export interface ValidatorRawTransactionData extends DelegatorRawTransactionData {
  // Additional required field for validator transactions
  delegationFeeRate: number;
}

/**
 * Raw transaction data for permissionless validator transactions
 */
export interface PermissionlessValidatorRawTransactionData extends ValidatorRawTransactionData {
  // Additional required fields for permissionless validator transactions
  blsPublicKey: string;
  blsSignature: string;
}

/**
 * Raw transaction data structure from serialized transactions
 * Union type supporting all transaction types with proper type safety
 */
export type RawTransactionData =
  | BaseRawTransactionData
  | DelegatorRawTransactionData
  | ValidatorRawTransactionData
  | PermissionlessValidatorRawTransactionData;

/**
 * Specific transaction extension types for better type safety
 */
export type TransactionWithBaseExtensions = BaseExtendedTransaction & Record<string, unknown>;
export type TransactionWithStakingExtensions = StakingExtendedTransaction & Record<string, unknown>;
export type TransactionWithValidatorExtensions = ValidatorExtendedTransaction & Record<string, unknown>;
export type TransactionWithPermissionlessValidatorExtensions = PermissionlessValidatorExtendedTransaction &
  Record<string, unknown>;
