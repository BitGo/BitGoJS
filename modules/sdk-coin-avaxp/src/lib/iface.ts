import { Entry, TransactionExplanation as BaseTransactionExplanation, TransactionType } from '@bitgo/sdk-core';
import { BaseTx as PMVBaseTx, Tx as PMVTx } from 'avalanche/dist/apis/platformvm';
import { EVMBaseTx, Tx as EMVTx } from 'avalanche/dist/apis/evm';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
  rewardAddresses: string[];
  inputs: Entry[];
  memo?: string;
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
  memo?: string;
  signatures: string[];
  stakedOutputs: Entry[];
  changeOutputs: Entry[];
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

export type Tx = PMVTx | EMVTx;
export type BaseTx = PMVBaseTx | EVMBaseTx;
