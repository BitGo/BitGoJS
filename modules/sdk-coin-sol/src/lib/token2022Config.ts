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
}

/**
 * Interface for transfer hook configuration
 */
export interface TransferHookConfig {
  /** Extra account metas required by the transfer hook */
  extraAccountMetas: ExtraAccountMeta[];
}

/**
 * Interface for Token-2022 configuration
 */
export interface Token2022Config {
  /** The mint address of the token */
  mintAddress: string;
  /** Transfer hook configuration if applicable */
  transferHook?: TransferHookConfig;
}

/**
 * Token configurations map
 * Key: mintAddress
 */
export const TOKEN_2022_CONFIGS: Record<string, Token2022Config> = {};

TOKEN_2022_STATIC_CONFIGS.forEach((config) => {
  TOKEN_2022_CONFIGS[config.mintAddress] = config;
});

/**
 * Get token configuration by mint address
 * @param mintAddress - The mint address of the token
 * @returns Token configuration or undefined if not found
 */
export function getToken2022Config(mintAddress: string): Token2022Config | undefined {
  return TOKEN_2022_CONFIGS[mintAddress];
}
