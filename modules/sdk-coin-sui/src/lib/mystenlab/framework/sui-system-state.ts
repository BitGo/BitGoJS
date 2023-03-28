import { MoveCallCommand, Transaction } from '../builder';
import { normalizeSuiObjectId, ObjectId, SuiAddress, SUI_FRAMEWORK_ADDRESS, SuiObjectRef } from '../types';

/**
 * Address of the Sui System object.
 * Always the same in every Sui network (local, devnet, testnet).
 */
export const SUI_SYSTEM_STATE_OBJECT_ID: string = normalizeSuiObjectId('0x5');

export const SUI_SYSTEM_MODULE_NAME = 'sui_system';
export const ADD_STAKE_FUN_NAME = 'request_add_stake';
export const ADD_STAKE_MUL_COIN_FUN_NAME = 'request_add_stake_mul_coin';
export const ADD_STAKE_LOCKED_COIN_FUN_NAME = 'request_add_stake_with_locked_coin';
export const WITHDRAW_STAKE_FUN_NAME = 'request_withdraw_stake';

/**
 * Utility class for `0x5` object
 */
export class SuiSystemStateUtil {
  /**
   * Create a new transaction for staking coins
   *
   * @param coins the coins to be staked
   * @param amount the amount to stake
   * @param gasBudget omittable only for DevInspect mode
   */
  public static newRequestAddStakeTxn(
    coins: SuiObjectRef[],
    amount: number,
    validatorAddress: SuiAddress
  ): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${SUI_FRAMEWORK_ADDRESS}::${SUI_SYSTEM_MODULE_NAME}::${ADD_STAKE_MUL_COIN_FUN_NAME}`,
      arguments: [tx.object(SUI_SYSTEM_STATE_OBJECT_ID), coins, tx.pure(validatorAddress)],
    } as MoveCallCommand);
    return tx;
  }

  /**
   * Create a new transaction for withdrawing coins
   *
   * @param stake the stake object created in the requestAddStake txn
   * @param gasBudget omittable only for DevInspect mode
   */
  public static newRequestWithdrawlStakeTxn(stake: ObjectId): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${SUI_FRAMEWORK_ADDRESS}::${SUI_SYSTEM_MODULE_NAME}::${WITHDRAW_STAKE_FUN_NAME}`,
      arguments: [tx.object(SUI_SYSTEM_STATE_OBJECT_ID), tx.object(stake)],
    } as MoveCallCommand);
    return tx;
  }
}
