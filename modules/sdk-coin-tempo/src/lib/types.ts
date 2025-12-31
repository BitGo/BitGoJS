import type { Address, Hex, TransactionSerializedEIP7702 } from 'viem';

/**
 * TIP-20 Operation with optional memo
 * Represents a single transfer operation in a transaction
 */
export interface Tip20Operation {
  token: Address;
  to: Address;
  amount: string;
  memo?: string;
}

/**
 * Re-export viem types for convenience
 */
export type { Address, Hex, TransactionSerializedEIP7702 };
