import {
  TransactionExplanation as BaseTransactionExplanation,
  Entry,
  TransactionType,
  SignTransactionOptions,
  VerifyTransactionOptions,
  TransactionParams,
} from '@bitgo-beta/sdk-core';
import { UnsignedTx, TransferableOutput, avaxSerial } from '@flarenetwork/flarejs';
export interface FlrpEntry extends Entry {
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
  memo?: string; // Memo field for transaction metadata
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
 * FlareJS uses string-based TypeSymbols instead of numeric type IDs
 * For SECP256K1 Transfer Output, use TypeSymbols.TransferOutput from @flarenetwork/flarejs
 *
 * @see https://docs.flare.network/ for Flare network documentation
 * @deprecated Use TypeSymbols.TransferOutput from @flarenetwork/flarejs instead
 */
export const SECP256K1_Transfer_Output = 7; // Legacy - FlareJS uses TypeSymbols.TransferOutput

export const ADDRESS_SEPARATOR = '~';
export const INPUT_SEPARATOR = ':';

// FlareJS 1.3.2 type definitions - using avm and platformvm modules
export type DeprecatedTx = unknown; // Placeholder for backward compatibility
export type DeprecatedBaseTx = unknown; // Placeholder for backward compatibility
export type Tx = UnsignedTx; // FlareJS UnsignedTx (unified type in 4.0.5)
export type BaseTx = avaxSerial.BaseTx; // FlareJS BaseTx
export type AvaxTx = avaxSerial.AvaxTx; // FlareJS AvaxTx
export type DeprecatedOutput = unknown; // Placeholder for backward compatibility
export type Output = TransferableOutput; // FlareJS TransferableOutput (unified type in 4.0.5)

// FLRP-specific interfaces extending SDK-core interfaces
export interface FlrpSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: {
    txHex: string;
  };
  prv: string;
}

export interface FlrpVerifyTransactionOptions extends VerifyTransactionOptions {
  txParams: FlrpTransactionParams;
}

export interface FlrpTransactionStakingOptions {
  nodeID: string;
  amount: string;
  startTime?: string;
  endTime?: string;
  delegationFeeRate?: number;
}

export interface FlrpTransactionParams extends TransactionParams {
  type: string;
  recipients?: Array<{
    address: string;
    amount: string;
  }>;
  stakingOptions?: FlrpTransactionStakingOptions;
  unspents?: string[];
}

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
}

/**
 * Memo utility interfaces for FlareJS integration
 */
export interface MemoData {
  text?: string; // UTF-8 string memo
  bytes?: Uint8Array; // Raw byte array memo
  json?: Record<string, unknown>; // JSON object memo (will be stringified)
}

/**
 * SpendOptions interface matching FlareJS patterns
 * Based on FlareJS SpendOptions with memo support
 */
export interface FlrpSpendOptions {
  minIssuanceTime?: bigint;
  changeAddresses?: string[]; // BitGo uses string addresses, FlareJS uses Uint8Array[]
  threshold?: number;
  memo?: Uint8Array; // FlareJS memo format (byte array)
  locktime?: bigint;
}
