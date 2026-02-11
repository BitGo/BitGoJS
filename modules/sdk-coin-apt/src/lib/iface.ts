import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionRecipient,
  TransactionType as BitGoTransactionType,
} from '@bitgo/sdk-core';
import { EntryFunctionABI, EntryFunctionArgumentTypes, SimpleEntryFunctionArgumentTypes } from '@aptos-labs/ts-sdk';

export interface AptTransactionExplanation extends BaseTransactionExplanation {
  sender?: string;
  type?: BitGoTransactionType;
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string | undefined;
  sender: string;
  /** @deprecated - use `recipients`. */
  recipient?: TransactionRecipient;
  recipients: TransactionRecipient[];
  sequenceNumber: number;
  maxGasAmount: number;
  gasUnitPrice: number;
  gasUsed: number;
  expirationTime: number;
  feePayer: string;
  assetId: string;
}

/**
 * The transaction data returned from the toJson() function of a delegation pool transaction
 */
export interface DelegationPoolTxData extends TxData {
  validatorAddress: string | null;
  amount: string | null;
}

export interface RecipientsValidationResult {
  recipients: {
    deserializedAddresses: string[];
    deserializedAmounts: Uint8Array[];
  };
  isValid: boolean;
}

/**
 * Parameters for custom Aptos entry function transactions.
 *
 * Enables calling any Aptos entry function while maintaining compatibility with existing BitGo SDK patterns.
 * Entry functions are the standard way to interact with Aptos smart contracts and system functions.
 *
 * @example Basic APT coin transfer (equivalent to standard transfer):
 * ```typescript
 * {
 *   moduleName: "0x1::aptos_account",
 *   functionName: "transfer_coins",
 *   typeArguments: ["0x1::aptos_coin::AptosCoin"],
 *   functionArguments: ["0x123...", 1000000] // [recipient, amount]
 * }
 * ```
 *
 * @example Custom smart contract call:
 * ```typescript
 * {
 *   moduleName: "0x867ed1f6bf916171b1de3ee92849b8978b7d1b9e0a8cc982a3d19d535dfd9c0c::aptos_names_v1",
 *   functionName: "register_domain",
 *   typeArguments: [],
 *   functionArguments: ["mydomain", 1] // [domain_name, years]
 * }
 * ```
 *
 * @remarks
 * - The `abi` field is optional but provides type validation when present
 * - ABI must match the exact function signature of the target entry function
 */
export interface CustomTransactionParams {
  /**
   * Fully qualified module name in format "address::module_name"
   *
   * @example "0x1::aptos_account" (system module)
   * @example "0x867ed1f6bf916171b1de3ee92849b8978b7d1b9e0a8cc982a3d19d535dfd9c0c::aptos_names_v1" (custom contract)
   */
  moduleName: string;

  /**
   * Entry function name to call within the specified module
   *
   * @example "transfer_coins", "register_domain", "create_account"
   */
  functionName: string;

  /**
   * Type arguments for generic functions (optional)
   *
   * Used for functions that accept generic types like Coin<T>.
   *
   * @example ["0x1::aptos_coin::AptosCoin"] for coin transfers
   * @example [] for functions without generic parameters
   */
  typeArguments?: string[];

  /**
   * Function arguments in the order expected by the entry function (optional)
   *
   * Arguments are automatically serialized based on their JavaScript types.
   * Use appropriate types: strings for addresses, numbers/BigInts for amounts.
   *
   * @example [recipient_address, amount] for transfers
   * @example [domain_name, duration] for domain registration
   */
  functionArguments?: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes>;

  /**
   * Entry function ABI for type validation and safety (optional)
   *
   * When provided:
   * - Validates argument count matches expected parameters
   * - Performs type checking during transaction building
   * - Improves error messages for invalid calls
   *
   * @remarks
   * - Providing incorrect ABI will cause transaction building to fail
   * - Must match the exact function signature of the target entry function
   */
  abi?: EntryFunctionABI;
}
