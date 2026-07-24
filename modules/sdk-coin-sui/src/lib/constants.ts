export const UNAVAILABLE_TEXT = 'UNAVAILABLE';
export const AMOUNT_UNKNOWN_TEXT = 'AMOUNT_UNKNOWN';

// Refer to
// https://github.com/MystenLabs/sui/blob/main/crates/sui-types/src/messages.rs#L50
export const DUMMY_SUI_GAS_PRICE = 1000;
export const SUI_ADDRESS_LENGTH = 32;
export const SER_BUFFER_SIZE = 8192;
// https://github.com/MystenLabs/sui/blob/e62839aecb192545c3951b6fa0bc84039120b373/crates/sui-protocol-config/src/lib.rs#L1496
export const MAX_COMMAND_ARGS = 512;
// https://github.com/MystenLabs/sui/blob/e62839aecb192545c3951b6fa0bc84039120b373/crates/sui-protocol-config/src/lib.rs#L1493
export const MAX_GAS_OBJECTS = 256;

export const SUI_INTENT_BYTES = Buffer.from([0, 0, 0]);

export const SIGNATURE_SCHEME_BYTES = [0x00];

export const MIN_STAKING_THRESHOLD = 1_000_000_000; // 1 SUI

// The maximum gas that is allowed. 0.1 SUI
export const MAX_GAS_BUDGET = 100000000;
export const DEFAULT_GAS_PRICE = 1000;
export const DEFAULT_GAS_OVERHEAD = 1.1;

/*
 * SUI transactions have a limit of 128 KB on the tx size,
 * that corresponds to a tx with max ~1600 objects depending on other transaction details,
 * we chose 1280 as the object limit, keeping in mind other things like multiple recipients etc.
 */
export const MAX_OBJECT_LIMIT = 1280;

export const DEFAULT_SCAN_FACTOR = 20; // default number of receive addresses to scan for funds

export const TOKEN_OBJECT_LIMIT = 512;
