/**
 * Constants for Tempo blockchain (EVM-compatible)
 */

export const MAINNET_COIN = 'tempo';
export const TESTNET_COIN = 'ttempo';

export const VALID_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
export const VALID_PUBLIC_KEY_REGEX = /^[A-Fa-f0-9]{64}$/;

/**
 * Tempo Chain IDs
 */
export const TEMPO_CHAIN_IDS = {
  MAINNET: 4217,
  TESTNET: 42431, // Moderato testnet
} as const;

/**
 * TIP-20 Token Standard
 * TIP-20 uses 6 decimals (unlike ERC-20's standard 18 decimals)
 */
export const TIP20_DECIMALS = 6;

/**
 * AA Transaction Type
 * Tempo uses EIP-7702 Account Abstraction with transaction type 0x76
 */
export const AA_TRANSACTION_TYPE = '0x76' as const;
