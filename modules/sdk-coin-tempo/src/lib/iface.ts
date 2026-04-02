/**
 * Interfaces for Tempo
 */
import type { RecoverOptions } from '@bitgo/abstract-eth';

/**
 * Optional Tempo-specific recovery fields (passed on {@link RecoverOptions}).
 * Fees on Tempo are paid in a TIP-20 token; defaults to the recovered token.
 */
export type TempoRecoveryOptions = RecoverOptions & {
  /** TIP-20 contract used to pay AA gas (defaults to token being swept) */
  feeTokenAddress?: string;
  /** Override default public RPC URL */
  rpcUrl?: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TransactionData {
  // TODO: Define transaction data structure
}

export interface TransactionOutput {
  address: string;
  amount: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TransactionInput {
  // TODO: Define transaction input structure
}
