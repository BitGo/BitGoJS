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

/**
 * Raw smart contract call with pre-encoded calldata
 * Used for arbitrary contract interactions (e.g., mint(), approve())
 * where the caller provides the full ABI-encoded calldata
 */
export interface RawContractCall {
  to: Address;
  data: Hex;
  value?: string;
}
