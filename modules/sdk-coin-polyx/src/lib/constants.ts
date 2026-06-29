/**
 * Address format constants for Polyx networks
 */

/**
 * Polyx mainnet address format
 */
export const POLYX_ADDRESS_FORMAT = 12;

/**
 * Tpolyx testnet address format
 */
export const TPOLYX_ADDRESS_FORMAT = 42;

/**
 * Regex pattern for validating Polymesh DID (Decentralized Identifier)
 * DIDs are 32-byte hex strings (0x prefix + 64 hex characters)
 */
export const POLYX_DID_REGEX = /^0x[a-fA-F0-9]{64}$/;

/** 32-byte memo as 0x-prefixed hex (same shape as POLYX_DID_REGEX). */
export const MEMO_HEX_REGEX = POLYX_DID_REGEX;

/** Maximum UTF-8 byte length for an on-chain Polymesh memo. */
export const MEMO_MAX_BYTES = 32;
