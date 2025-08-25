export const IOTA_ADDRESS_LENGTH = 64;
export const IOTA_TRANSACTION_ID_LENGTH = 64;
export const IOTA_BLOCK_ID_LENGTH = 64;
export const IOTA_SIGNATURE_LENGTH = 128;
export const ADDRESS_BYTES_LENGTH = 32;
export const AMOUNT_BYTES_LENGTH = 8;
export const SECONDS_PER_WEEK = 7 * 24 * 60 * 60; // 1 week in seconds

// Define IOTA specific function paths
export const IOTA_TRANSFER_FUNCTION = '0x0::coin::transfer';
export const IOTA_BATCH_TRANSFER_FUNCTION = '0x1::coin_batch::transfer';
