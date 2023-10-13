import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType as BitGoTransactionType,
} from '@bitgo/sdk-core';
import {
  GasData,
  ProgrammableTransaction,
  CallArg,
  SuiAddress,
  SuiObjectRef,
  TransactionExpiration,
} from './mystenlab/types';
import { TransactionType, TransactionBlockInput } from './mystenlab/builder';

export enum SuiTransactionType {
  Transfer = 'Transfer',
  AddStake = 'AddStake',
  WithdrawStake = 'WithdrawStake',
  CustomTx = 'CustomTx',
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: BitGoTransactionType;
}

export interface TxData {
  id?: string;
  sender: SuiAddress;
  expiration: TransactionExpiration;
  gasData: GasData;
  kind: {
    ProgrammableTransaction:
      | TransferProgrammableTransaction
      | StakingProgrammableTransaction
      | CustomProgrammableTransaction;
  };
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

export interface SuiTransaction<
  T = TransferProgrammableTransaction | StakingProgrammableTransaction | CustomProgrammableTransaction
> {
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

/**
 * Method names for the transaction method. Names change based on the type of transaction e.g 'request_add_delegation_mul_coin' for the staking transaction
 */
export enum MethodNames {
  /**
   * Add stake to a validator's staking pool.
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md#function-request_add_stake
   */
  RequestAddStake = 'request_add_stake',
  /**
   * Withdraw some portion of a stake from a validator's staking pool.
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md#function-request_withdraw_stake
   */
  RequestWithdrawStake = 'request_withdraw_stake',
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
}
