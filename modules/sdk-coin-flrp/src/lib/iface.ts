import {
  TransactionExplanation as BaseTransactionExplanation,
  Entry,
  SignTransactionOptions,
  TransactionParams,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionType,
  VerifyTransactionOptions,
  TransactionRecipient,
} from '@bitgo/sdk-core';
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

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
  rewardAddresses: string[];
  inputs: Entry[];
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

export const ADDRESS_SEPARATOR = '~';

// Simplified type definitions for Flare
export type Tx =
  | pvmSerial.BaseTx
  | UnsignedTx
  | evmSerial.ExportTx
  | evmSerial.ImportTx
  | pvmSerial.ExportTx
  | pvmSerial.ImportTx;

export type SerializedTx = evmSerial.ExportTx | evmSerial.ImportTx | pvmSerial.ExportTx | pvmSerial.ImportTx;
export type BaseTx = pvmSerial.BaseTx;
export type Output = TransferableOutput;
export interface FlrpVerifyTransactionOptions extends VerifyTransactionOptions {
  txParams: FlrpTransactionParams;
}

export interface FlrpTransactionParams extends TransactionParams {
  type: string;
  locktime?: number;
  unspents?: string[];
  sourceChain?: string;
}

export interface FlrpEntry extends Entry {
  id: string;
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

export interface TxInfo {
  recipients: TransactionRecipient[];
  from: string;
  txid: string;
}

export interface FlrpExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  publicKeys?: string[];
}
