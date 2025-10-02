/**
 * Token-2022 Configuration for Solana tokens with transfer hooks
 * This file contains static configurations for Token-2022 tokens to avoid RPC calls
 * when building transfer transactions with transfer hooks.
 */

import { TOKEN_2022_STATIC_CONFIGS } from '../config/token2022StaticConfig';

/**
 * Interface for extra account metadata needed by transfer hooks
 */
export interface ExtraAccountMeta {
  /** The public key of the account */
  pubkey: string;
  /** Whether the account is a signer */
  isSigner: boolean;
  /** Whether the account is writable */
  isWritable: boolean;
  /** Optional seed for PDA derivation */
  seeds?: Array<{
    /** Literal seed value or instruction account index reference */
    value: string | number;
    /** Type of seed: 'literal' for string/buffer, 'accountKey' for instruction account index */
    type: 'literal' | 'accountKey';
  }>;
}

/**
 * Interface for transfer hook configuration
 */
export interface TransferHookConfig {
  /** The transfer hook program ID */
  programId: string;
  /** The transfer hook authority */
  authority: string;
  /** Extra account metas required by the transfer hook */
  extraAccountMetas: ExtraAccountMeta[];
  /** The PDA address for extra account metas (cached) */
  extraAccountMetasPDA?: string;
}

/**
 * Interface for Token-2022 configuration
 */
export interface Token2022Config {
  /** The mint address of the token */
  mintAddress: string;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Number of decimal places */
  decimals: number;
  /** Program ID (TOKEN_2022_PROGRAM_ID) */
  programId: string;
  /** Transfer hook configuration if applicable */
  transferHook?: TransferHookConfig;
  /** Whether the token has transfer fees */
  hasTransferFees?: boolean;
}

/**
 * Token configurations map
 * Key: mintAddress or symbol
 */
export const TOKEN_2022_CONFIGS: Record<string, Token2022Config> = {};

TOKEN_2022_STATIC_CONFIGS.forEach((config) => {
  TOKEN_2022_CONFIGS[config.mintAddress] = config;
  TOKEN_2022_CONFIGS[config.symbol] = config;
});

// Create symbol mappings for convenience
Object.values(TOKEN_2022_CONFIGS).forEach((config) => {
  TOKEN_2022_CONFIGS[config.symbol] = config;
});

/**
 * Get token configuration by mint address
 * @param mintAddress - The mint address of the token
 * @returns Token configuration or undefined if not found
 */
export function getToken2022Config(mintAddress: string): Token2022Config | undefined {
  return TOKEN_2022_CONFIGS[mintAddress];
}
