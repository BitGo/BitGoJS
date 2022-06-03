import { TransferableInput, TransferableOutput } from 'avalanche/dist/apis/platformvm';
import { TransactionExplanation as BaseTransactionExplanation } from '@bitgo/sdk-core';

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
  // mandatory base Tx
  typeID: number;
  network_id: number;
  blockchain_id: string;
  outputs: TransferableOutput[];
  inputs: TransferableInput[];
  memo: string;
  // addDelegator extends BaseTx
  // validator?: {
  //   nodeID: string;
  //   startTime: number; // unix time
  //   endTime: number; // unix time
  //   weight: number; // amount delegator stakes
  // };
  // stake?: {
  //   lockedOuts: TransferableOutput[]; // array of transferable outputs that are locked during staking period
  // };
  // rewards_owner?: SECPOwnerOutput;
  // // addValidator extends BaseTx, validator, stake, rewards_owner
  // shares?: number; // 10,000 x percentage of reward taken from delegators
}

export enum TransactionTypes {
  addDelegator = 'addDelegator',
  addValidator = 'addValidator',
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type_id: number;
  input: TransferableInput;
  output: TransferableOutput;
  blockchain_id: string;
  memo?: string;
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
};
