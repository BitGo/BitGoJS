import {
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseTxInfo, DecodedUnsignedTx, TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import { Args } from '@substrate/txwrapper-core/lib/types/method';

export { HexString } from '@polkadot/util/types';

/**
 * Section names for the transaction methods.
 */
export enum SectionNames {
  Proxy = 'proxy',
}

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
   * Transfer funds with an optional memo attached.
   * The memo allows adding context or metadata to the transaction, commonly used for recordkeeping or identification.
   *
   * @see https://developers.polymesh.network/sdk-docs/enums/Generated/Types/BalancesTx/#transferwithmemo
   */
  TransferWithMemo = 'transferWithMemo',
  AddStake = 'addStake',
  RemoveStake = 'removeStake',

  /**
   * Take the origin account as a stash and lock up value of its balance.
   */
  Bond = 'bond',
  /**
   * Add some extra amount that have appeared in the stash free_balance into the balance up for staking.
   */
  BondExtra = 'bondExtra',
  /**
   * Declare the desire to nominate targets for the origin controller.
   */
  Nominate = 'nominate',
  /**
   * Declare no desire to either validate or nominate.
   */
  Chill = 'chill',
  /**
   * Schedule a portion of the stash to be unlocked ready for transfer out after the bond period ends.
   */
  Unbond = 'unbond',
  /**
   * Remove any unlocked chunks from the unlocking queue from our management.
   */
  WithdrawUnbonded = 'withdrawUnbonded',
  /**
   * Send a batch of dispatch calls.
   */
  Batch = 'batch',
  /**
   * Send a batch of dispatch calls and atomically execute them.
   */
  BatchAll = 'batchAll',

  /**
   * Registers a Decentralized Identifier (DID) along with Customer Due Diligence (CDD) information.
   *
   * @see https://developers.polymesh.network/sdk-docs/enums/Generated/Types/IdentityTx/#cddregisterdidwithcdd
   */
  RegisterDidWithCDD = 'cddRegisterDidWithCdd',
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
  keepAlive?: boolean;
  netuid?: string;
  numSlashingSpans?: number;
  batchCalls?: BatchCallObject[];
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

export interface TransferWithMemoArgs extends Args {
  dest: { id: string };
  value: string;
  memo: string;
}

export interface AddStakeArgs extends Args {
  amountStaked: string;
  hotkey: string;
  netuid: string;
}

export interface RemoveStakeArgs extends Args {
  amountUnstaked: string;
  hotkey: string;
  netuid: string;
}

export interface BondArgs extends Args {
  value: string;
  controller: string;
  payee: string | { Account: string };
}

export interface BondExtraArgs extends Args {
  maxAdditional: string;
}

export interface NominateArgs extends Args {
  targets: string[];
}

export interface ChillArgs extends Args {
  [key: string]: never; // Chill has no arguments
}

export interface UnbondArgs extends Args {
  value: string;
}

export interface WithdrawUnbondedArgs extends Args {
  numSlashingSpans: number;
}

export interface BatchCallObject {
  method: string;
  args: Record<string, unknown>;
}

export interface BatchArgs {
  calls: BatchCallObject[];
}

/**
 * Decoded TxMethod from a transaction hex
 */
export interface TxMethod {
  args:
    | TransferArgs
    | TransferAllArgs
    | AddStakeArgs
    | RemoveStakeArgs
    | BondArgs
    | BondExtraArgs
    | NominateArgs
    | ChillArgs
    | UnbondArgs
    | WithdrawUnbondedArgs
    | BatchArgs;
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
}

export enum TransactionTypes {
  TRANSFER = 'transfer',
}

export interface Material {
  genesisHash: string;
  chainName: string;
  specName: string;
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
