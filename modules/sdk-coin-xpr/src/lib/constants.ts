/**
 * Constants for Proton (XPR Network)
 */

// Proton mainnet chain ID
export const MAINNET_CHAIN_ID = '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0';

// Proton testnet chain ID
export const TESTNET_CHAIN_ID = '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd';

// Coin names
export const MAINNET_COIN = 'xpr';
export const TESTNET_COIN = 'txpr';

// XPR token symbol and precision
export const XPR_SYMBOL = 'XPR';
export const XPR_PRECISION = 4;

// Token contract
export const TOKEN_CONTRACT = 'eosio.token';

// Account name constraints
export const MAX_ACCOUNT_NAME_LENGTH = 12;

// Valid characters for EOSIO account names: a-z, 1-5, and dot
// Note: Account names must be lowercase and cannot start or end with a dot
export const VALID_ACCOUNT_NAME_REGEX = /^[a-z1-5.]{1,12}$/;

// Public key formats (PUB_K1_, EOS legacy format)
export const VALID_PUBLIC_KEY_REGEX = /^(PUB_K1_[A-Za-z0-9]{50}|EOS[A-Za-z0-9]{50,52})$/;

// Private key format (PVT_K1_ or WIF)
export const VALID_PRIVATE_KEY_REGEX = /^(PVT_K1_[A-Za-z0-9]{47,52}|5[HJK][A-Za-z0-9]{49,50})$/;

// Transaction constants
export const DEFAULT_EXPIRATION_SECONDS = 120; // 2 minutes
export const MAX_EXPIRATION_SECONDS = 3600; // 1 hour
