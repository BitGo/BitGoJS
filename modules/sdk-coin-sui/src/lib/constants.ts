import { SharedObjectRef } from './iface';

export const UNAVAILABLE_TEXT = 'UNAVAILABLE';
export const TRANSFER_AMOUNT_UNKNOWN_TEXT = 'TRANSFER_AMOUNT_UNKNOWN';

// Need to keep in sync with
// https://github.com/MystenLabs/sui/blob/f32877f2e40d35a008710c232e49b57aab886462/crates/sui-types/src/messages.rs#L338
export const SUI_GAS_PRICE = 1;
export const SUI_ADDRESS_LENGTH = 20;
export const SER_BUFFER_SIZE = 8192;

export const SUI_INTENT_BYTES = Buffer.from([0, 0, 0]);

export const SIGNATURE_SCHEME_BYTES = [0x00];

// SUI staking related constants
export const SUI_PACKAGE_FRAMEWORK_ADDRESS = '0000000000000000000000000000000000000002';
export const SUI_SYSTEM_STATE_OBJECT_ID = '0000000000000000000000000000000000000005';

export const SUI_SYSTEM_STATE_OBJECT = {
  objectId: SUI_SYSTEM_STATE_OBJECT_ID,
  initialSharedVersion: 1,
  mutable: true,
} as SharedObjectRef;

export const ADD_DELEGATION_SYSTEM_STATE_INDEX = 0;
export const ADD_DELEGATION_COINS_INDEX = 1;
export const ADD_DELEGATION_AMOUNT_INDEX = 2;
export const ADD_DELEGATION_VALIDATOR_INDEX = 3;

export const WITHDRAW_DELEGATION_SYSTEM_STATE_INDEX = 0;
export const WITHDRAW_DELEGATION_STAKED_SUI_INDEX = 1;

export const SWITCH_DELEGATION_SYSTEM_STATE_INDEX = 0;
export const SWITCH_DELEGATION_STAKED_SUI_INDEX = 1;
export const SWITCH_DELEGATION_VALIDATOR_INDEX = 2;
