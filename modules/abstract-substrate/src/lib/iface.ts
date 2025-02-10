import {
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType,
} from '@bitgo/sdk-core';
import { PolkadotSpecNameType } from '@bitgo/statics';
import { BaseTxInfo, DecodedUnsignedTx, TypeRegistry } from '@substrate/txwrapper-core/lib/types';

/**
 * Method names for the transaction method. Names change based on the type of transaction e.g 'bond' for the staking transaction
 */
export enum MethodNames {
  /**
   * Transfer the entire transferable balance from the caller account.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#transferalldest-multiaddress-keep_alive-bool
   */
  TransferAll = 'transferAll',
  /**
   * Same as the transfer call, but with a check that the transfer will not kill the origin account.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#transferkeepalivedest-multiaddress-value-compactu128
   */
  TransferKeepAlive = 'transferKeepAlive',
  /**
   * Schedule a portion of the stash to be unlocked ready for transfer out after the bond period ends.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#unbondvalue-compactu128
   */
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  sender: string;
  referenceBlock: string;
  blockNumber: number;
  genesisHash: string;
  nonce: number;
  specVersion: number;
  transactionVersion: number;
  chainName: string;
  method?: string;
  specName?: string;
  amount?: string;
  to?: string;
  tip?: number;
  eraPeriod?: number;
  payee?: string;
  owner?: string;
  delay?: string;
  index?: string;
  keepAlive?: boolean;
}

/**
 * Transaction method specific args
 */
export interface TransferArgs {
  dest: { id: string };
  value: string;
}

/**
 * Transaction method specific args
 */
export interface TransferAllArgs {
  dest: { id: string };
  keepAlive: boolean;
}

/**
 * Decoded TxMethod from a transaction hex
 */
export interface TxMethod {
  args: TransferArgs | TransferAllArgs;
  name: MethodNames;
  pallet: string;
}

/**
 * Modified unsigned transaction with a decoded method instead of a method hex
 */
export interface DecodedTx extends Omit<DecodedUnsignedTx, 'method'> {
  method: TxMethod;
}

/**
 * Base transaction info shared across all types of transactions
 */
export interface CreateBaseTxInfo {
  baseTxInfo: BaseTxInfo;
  options: {
    metadataRpc: `0x${string}`;
    registry: TypeRegistry;
    isImmortalEra?: boolean;
  };
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
  payee?: string;
  owner?: string;
  delay?: string;
}

export interface Material {
  genesisHash: string;
  chainName: string;
  specName: PolkadotSpecNameType;
  specVersion: number;
  txVersion: number;
  metadata: `0x${string}`;
}

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  transaction: TxData;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface VerifiedTransactionParameters {
  txHex: string;
  prv: string;
}
