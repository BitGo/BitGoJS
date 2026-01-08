/**
 * Type aliases for Ethereum addresses and hex strings
 */
export type Address = string;
export type Hex = string;
export type TransactionSerializedEIP7702 = string;

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
