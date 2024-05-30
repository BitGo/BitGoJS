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
