import { normalizeSuiObjectId, SharedObjectRef } from '../types';

/**
 * Address of the Sui System object.
 * Always the same in every Sui network (local, devnet, testnet).
 */
export const SUI_SYSTEM_STATE_OBJECT_ID: string = normalizeSuiObjectId('0x5');

export const SUI_SYSTEM_STATE_OBJECT: SharedObjectRef = {
  objectId: SUI_SYSTEM_STATE_OBJECT_ID,
  initialSharedVersion: 1,
  mutable: true,
};

export const SUI_SYSTEM_MODULE_NAME = 'sui_system';
export const ADD_STAKE_FUN_NAME = 'request_add_stake';
export const ADD_STAKE_LOCKED_COIN_FUN_NAME = 'request_add_stake_with_locked_coin';
export const WITHDRAW_STAKE_FUN_NAME = 'request_withdraw_stake';

// https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/staking_pool.md
export const SUI_STAKING_POOL_MODULE_NAME = 'staking_pool';
export const SUI_STAKING_POOL_SPLIT_FUN_NAME = 'split';
