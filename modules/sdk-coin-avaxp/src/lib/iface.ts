import { Entry, TransactionExplanation as BaseTransactionExplanation, TransactionType } from '@bitgo/sdk-core';
import { BaseTx as PMVBaseTx, TransferableOutput, Tx as PMVTx } from 'avalanche/dist/apis/platformvm';
import { EVMBaseTx, EVMOutput, Tx as EMVTx } from 'avalanche/dist/apis/evm';
import { pvmSerial } from '@avalabs/avalanchejs';

// import { BaseTx as PMVBaseTx, TransferableOutput, Tx as DeprecatedPMVTx } from 'avalanche/dist/apis/platformvm';
// import { EVMBaseTx, EVMOutput, Tx as DeprecatedEMVTx } from 'avalanche/dist/apis/evm';
// import { PVMTx } from '@avalabs/avalanchejs/dist/serializable/pvm/abstractTx';
// import { EVMTx } from '@avalabs/avalanchejs/dist/serializable/evm';
// import { BaseTx } from '@avalabs/avalanchejs/dist/serializable/avax';

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
// export type Tx = DeprecatedPMVTx | DeprecatedEMVTx | PVMTx | EVMTx;
export type DeprecatedBaseTx = PMVBaseTx | EVMBaseTx;
// // export type AvaxTx = PVMTx | EVMTx;

export type DeprecatedTx = PMVTx | EMVTx;

export type BaseTx = pvmSerial.BaseTx;
export type Tx = pvmSerial.AddPermissionlessValidatorTx;
export type Output = TransferableOutput | EVMOutput;
