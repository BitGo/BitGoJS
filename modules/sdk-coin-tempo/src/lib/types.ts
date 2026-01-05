/**
 * Ethereum-style address (0x-prefixed hex string)
 */
export type Address = string;

/**
 * Hex-encoded string (0x-prefixed)
 */
export type Hex = string;

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
