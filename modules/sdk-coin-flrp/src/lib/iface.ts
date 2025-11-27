import { TransactionExplanation as BaseTransactionExplanation, Entry, TransactionType } from '@bitgo/sdk-core';
import { pvmSerial, UnsignedTx, TransferableOutput, evmSerial } from '@flarenetwork/flarejs';

/**
 * Enum for Flare transaction types
 */
export enum FlareTransactionType {
  EvmExportTx = 'evm.ExportTx',
  EvmImportTx = 'evm.ImportTx',
  PvmExportTx = 'pvm.ExportTx',
  PvmImportTx = 'pvm.ImportTx',
}

export interface FlrpEntry extends Entry {
  id: string;
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
  rewardAddresses: string[];
  inputs: Entry[];
}

/**
 * Method names for the transaction method. Names change based on the type of transaction
 */
export enum MethodNames {
  addPermissionlessValidator,
  addPermissionlessDelegator,
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  inputs: Entry[];
  type: TransactionType;
  fromAddresses: string[];
  threshold: number;
  locktime: string;
  signatures: string[];
  outputs: Entry[];
  changeOutputs: Entry[];
  sourceChain?: string;
  destinationChain?: string;
}

/**
 * Decoded UTXO object. This is for a single utxo
 *
 * @param {number} outputID
 * @param {string} amount Amount as a Big Number string
 * @param {string} txid Transaction ID encoded as cb58
 * @param {string} outputidx Output index as a string
 */
export type DecodedUtxoObj = {
  outputID: number;
  locktime?: string;
  amount: string;
  txid: string;
  outputidx: string;
  threshold: number;
  addresses: string[];
  addressesIndex?: number[];
};

/**
 * TypeId value for SECP256K1 Transfer Output
 *
 * Similar to Avalanche P-Chain's SECP256K1 Transfer Output
 */
export const SECP256K1_Transfer_Output = 7;

/**
 * TypeId value for Stakeable Lock Output
 */
export const SECP256K1_STAKEABLE_LOCK_OUT = 22;

export const ADDRESS_SEPARATOR = '~';
export const INPUT_SEPARATOR = ':';

// Simplified type definitions for Flare
export type Tx =
  | pvmSerial.BaseTx
  | UnsignedTx
  | evmSerial.ExportTx
  | evmSerial.ImportTx
  | pvmSerial.ExportTx
  | pvmSerial.ImportTx;
export type BaseTx = pvmSerial.BaseTx;
export type Output = TransferableOutput;
export type DeprecatedTx = unknown;
/**
 * Interface for staking options
 */
export interface FlrpTransactionStakingOptions {
  nodeID: string;
  startTime: string;
  endTime: string;
  amount: string;
  rewardAddress?: string;
  delegationFee?: number;
}

/**
 * Interface for transaction parameters
 */
export interface FlrpTransactionParams {
  recipients?: {
    address: string;
    amount: string;
  }[];
  stakingOptions?: FlrpTransactionStakingOptions;
  unspents?: string[];
  type?: string;
}

/**
 * Interface for transaction verification options
 */
export interface FlrpVerifyTransactionOptions {
  txPrebuild: {
    txHex: string;
  };
  txParams: FlrpTransactionParams;
}

/**
 * Interface for explaining transaction options
 */
export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
}
