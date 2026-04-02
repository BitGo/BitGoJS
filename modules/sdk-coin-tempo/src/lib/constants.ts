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

/**
 * Fallback JSON-RPC endpoints when `common.Environments[bitgo.getEnv()].evm.tempo|ttempo.rpcUrl`
 * is missing (should not happen for normal envs). Primary RPC config lives in sdk-core
 * `environments.ts` under `evm.tempo` / `evm.ttempo`; `@bitgo/statics` networks only define
 * explorer URLs and chainId, not RPC.
 */
export const TEMPO_RPC_URLS = {
  MAINNET: 'https://rpc.mainnet.tempo.xyz',
  TESTNET: 'https://rpc.testnet.tempo.xyz',
} as const;
