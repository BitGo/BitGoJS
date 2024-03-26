import { TransactionExplanation as BaseTransactionExplanation, Entry, TransactionType } from '@bitgo/sdk-core';
import { EVMBaseTx as DeprecatedEVMBaseTx, Tx as EMVTx, EVMOutput } from 'avalanche/dist/apis/evm';
import { BaseTx as DeprecatedPMVBaseTx, Tx as PMVTx, TransferableOutput } from 'avalanche/dist/apis/platformvm';
import { AddPermissionlessValidatorTx } from 'bitgo-aaron-avalanchejs/dist/serializable/pvm/addPermissionlessValidatorTx';

export interface AvaxpEntry extends Entry {
  id: string;
}
export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
  rewardAddresses: string[];
  inputs: Entry[];
}

/**
 * Method names for the transaction method. Names change based on the type of transaction e.g 'bond' for the staking transaction
 */
export enum MethodNames {
  addDelegator,
  addValidator,
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
 * {@link https://docs.avax.network/specs/platform-transaction-serialization#secp256k1-transfer-output-example }
 */
export const SECP256K1_Transfer_Output = 7;

export const ADDRESS_SEPARATOR = '~';
export const INPUT_SEPARATOR = ':';
export type DeprecatedTx = PMVTx | EMVTx;
export type DeprecatedBaseTx = DeprecatedPMVBaseTx | DeprecatedEVMBaseTx;
export type Tx = AddPermissionlessValidatorTx;
export type Output = TransferableOutput | EVMOutput;
