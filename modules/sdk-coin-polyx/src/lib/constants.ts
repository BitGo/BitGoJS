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
