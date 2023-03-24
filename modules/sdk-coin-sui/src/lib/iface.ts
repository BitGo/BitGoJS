import { Recipient, TransactionExplanation as BaseTransactionExplanation, TransactionType } from '@bitgo/sdk-core';
import { GasData, ProgrammableTransaction, SuiAddress, SuiObjectRef, TransactionExpiration } from './mystenlab/types';
import { TransactionCommand, TransactionInput } from './mystenlab/builder';

export enum SuiTransactionType {
  Transfer = 'Transfer',
  AddStake = 'AddStake',
  WithdrawStake = 'WithdrawStake',
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export interface TxData {
  id?: string;
  sender: SuiAddress;
  expiration: TransactionExpiration;
  gasData: GasData;
  kind: { ProgrammableTransaction: TransferProgrammableTransaction | StakingProgrammableTransaction };
}

export type TransferProgrammableTransaction =
  | ProgrammableTransaction
  | {
      inputs: TransactionInput[];
      commands: TransactionCommand[];
    };

export type StakingProgrammableTransaction =
  | ProgrammableTransaction
  | {
      inputs: TransactionInput[];
      commands: TransactionCommand[];
    };

export interface SuiTransaction<T = TransferProgrammableTransaction | StakingProgrammableTransaction> {
  id?: string;
  type: SuiTransactionType;
  sender: string;
  tx: T;
  gasData: GasData;
}

export interface TransferTx {
  coins: SuiObjectRef[];
  recipients: Recipient[];
}

export interface RequestAddStake {
  coins: SuiObjectRef[];
  amount: number;
  validatorAddress: SuiAddress;
}

export interface RequestWithdrawStake {
  stakedSuiObjectId: SuiObjectRef;
  amount: number;
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
   * Add stake to a validator's staking pool using multiple coins..
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md#function-request_add_stake_mul_coin
   */
  RequestAddStakeMulCoin = 'request_add_stake_mul_coin',
  /**
   * Withdraw some portion of a stake from a validator's staking pool.
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md#function-request_withdraw_stake
   */
  RequestWithdrawStake = 'request_withdraw_stake',
}
