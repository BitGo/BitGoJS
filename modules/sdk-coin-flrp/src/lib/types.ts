// Type definitions for Flare P-chain transaction builders
// Replaces loose 'any' types with proper type safety

import { DecodedUtxoObj } from './iface';

/**
 * Extended transaction interface with additional properties
 * used by transaction builders
 */
export interface ExtendedTransaction {
  _rewardAddresses?: string[];
  _outputAmount?: string;
  _memo?: Uint8Array;
  _delegationFeeRate?: number;
  _blsPublicKey?: string;
  _blsSignature?: string;
  _nodeID?: string;
  _startTime?: bigint;
  _endTime?: bigint;
  _stakeAmount?: bigint;
  _utxos?: DecodedUtxoObj[];
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
 * Transaction with extended properties type assertion helper
 */
export type TransactionWithExtensions = ExtendedTransaction & Record<string, unknown>;
