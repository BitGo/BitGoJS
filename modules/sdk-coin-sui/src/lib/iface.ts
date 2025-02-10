import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType as BitGoTransactionType,
} from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import {
  CallArg,
  GasData,
  ProgrammableTransaction,
  SuiAddress,
  SuiObjectRef,
  TransactionExpiration,
} from './mystenlab/types';
import { TransactionBlockInput, TransactionType } from './mystenlab/builder';

export enum SuiTransactionType {
  Transfer = 'Transfer',
  AddStake = 'AddStake',
  WithdrawStake = 'WithdrawStake',
  CustomTx = 'CustomTx',
  TokenTransfer = 'TokenTransfer',
  WalrusStakeWithPool = 'WalrusStakeWithPool',
  WalrusRequestWithdrawStake = 'WalrusRequestWithdrawStake',
  WalrusWithdrawStake = 'WalrusWithdrawStake',
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: BitGoTransactionType;
}

export type SuiProgrammableTransaction =
  | TransferProgrammableTransaction
  | StakingProgrammableTransaction
  | UnstakingProgrammableTransaction
  | CustomProgrammableTransaction
  | TokenTransferProgrammableTransaction
  | WalrusStakingProgrammableTransaction
  | WalrusWithdrawStakeProgrammableTransaction;

export interface TxData {
  id?: string;
  sender: SuiAddress;
  expiration: TransactionExpiration;
  gasData: GasData;
  kind: {
    ProgrammableTransaction: SuiProgrammableTransaction;
  };
  inputObjects?: SuiObjectRef[];
}

export type TransferProgrammableTransaction =
  | ProgrammableTransaction
  | {
      inputs: CallArg[] | TransactionBlockInput[];
      transactions: TransactionType[];
    };

export type StakingProgrammableTransaction =
  | ProgrammableTransaction
  | {
      inputs: CallArg[] | TransactionBlockInput[];
      transactions: TransactionType[];
    };

export type UnstakingProgrammableTransaction =
  | ProgrammableTransaction
  | {
      inputs: CallArg[] | TransactionBlockInput[];
      transactions: TransactionType[];
    };

export type CustomProgrammableTransaction =
  | ProgrammableTransaction
  | {
      inputs: CallArg[] | TransactionBlockInput[];
      transactions: TransactionType[];
    };

export type TokenTransferProgrammableTransaction =
  | ProgrammableTransaction
  | {
      inputs: CallArg[] | TransactionBlockInput[];
      transactions: TransactionType[];
    };

export type WalrusStakingProgrammableTransaction =
  | ProgrammableTransaction
  | {
      inputs: CallArg[] | TransactionBlockInput[];
      transactions: TransactionType[];
    };

export type WalrusWithdrawStakeProgrammableTransaction =
  | ProgrammableTransaction
  | {
      inputs: CallArg[] | TransactionBlockInput[];
      transactions: TransactionType[];
    };

export interface SuiTransaction<T = SuiProgrammableTransaction> {
  id?: string;
  type: SuiTransactionType;
  sender: string;
  tx: T;
  gasData: GasData;
}

export interface RequestAddStake {
  amount: number;
  validatorAddress: SuiAddress;
}

export interface RequestWithdrawStakedSui {
  amount?: number;
  stakedSui: SuiObjectRef;
}

export interface RequestWalrusStakeWithPool {
  amount: number;
  validatorAddress: SuiAddress;
}

export interface RequestWalrusWithdrawStake {
  amount?: number;
  stakedWal: SuiObjectRef;
}

/**
 * Method names for the transaction method. Names change based on the type of transaction e.g 'request_add_delegation_mul_coin' for the staking transaction
 */
export enum MethodNames {
  /**
   * Add stake to a validator's staking pool.
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md#function-request_add_stake
   */
  RequestAddStake = '::sui_system::request_add_stake',
  /**
   * Withdraw some portion of a stake from a validator's staking pool.
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md#function-request_withdraw_stake
   */
  RequestWithdrawStake = '::sui_system::request_withdraw_stake',
  /**
   * Split StakedSui self to two parts, one with principal split_amount, and the remaining principal is left in self.
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/staking_pool.md#0x3_staking_pool_split
   */
  StakingPoolSplit = '::staking_pool::split',
  /**
   * Transfer ownership of obj to recipient.
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/transfer.md#function-public_transfer
   */
  PublicTransfer = '::transfer::public_transfer',
  /**
   * Walrus stake with pool.
   *
   * @see https://github.com/MystenLabs/walrus-docs/blob/8ba15d67d7ed0e728077e1600866fddd46fd113b/contracts/walrus/sources/staking.move#L289
   */
  WalrusStakeWithPool = '::staking::stake_with_pool',
  /**
   * @see https://github.com/MystenLabs/walrus-docs/blob/9307e66df0ea3f6555cdef78d46aefa62737e216/contracts/walrus/sources/staking.move#L221
   */
  WalrusRequestWithdrawStake = '::staking::request_withdraw_stake',
  /**
   * @see https://github.com/MystenLabs/walrus-docs/blob/9307e66df0ea3f6555cdef78d46aefa62737e216/contracts/walrus/sources/staking.move#L231
   */
  WalrusWithdrawStake = '::staking::withdraw_stake',
  /**
   * @see https://github.com/MystenLabs/walrus-docs/blob/9307e66df0ea3f6555cdef78d46aefa62737e216/contracts/walrus/sources/staking/staked_wal.move#L143
   */
  WalrusSplitStakedWal = '::staked_wal::split',
}

export interface SuiObjectInfo extends SuiObjectRef {
  /** balance */
  balance: BigNumber;
}
