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
 * Raw transaction data structure from serialized transactions
 */
export interface RawTransactionData {
  rewardAddresses?: string[];
  delegationFeeRate?: number;
  blsPublicKey?: string;
  blsSignature?: string;
  nodeID?: string;
  startTime?: string | number | bigint;
  endTime?: string | number | bigint;
  stakeAmount?: string | number | bigint;
  memo?: Uint8Array | string;
  utxos?: DecodedUtxoObj[];
  outputAmount?: string;
  networkID?: number;
  blockchainID?: Buffer | string;
}

/**
 * Transaction with extended properties type assertion helper
 */
export type TransactionWithExtensions = ExtendedTransaction & Record<string, unknown>;
