import BigNumber from "bignumber.js";
import { BaseAddress, BaseKey } from "./iface";
import { BaseTransaction } from "../../transaction";

export interface BaseCoin {
  /**
   * The statics fullName of this coin
   */
  displayName(): string;

  /**
   * Validate an address. Throws an exception if invalid.
   * @param address the address
   * @param addressFormat the address format - this will be handled by the implementing coin as an
   *     enum
   */
  validateAddress(address: BaseAddress, addressFormat?: string);

  /***
   * Validates the value corresponding to an amount can be used for this transaction. Throws an
   * exception if invalid.
   */
  validateValue(value: BigNumber);

  /***
   * Validates a private key.
   */
  validateKey(key: BaseKey);

  /**
   * Parse a transaction from a raw format.
   * @param rawTransaction the raw transaction in this case. format determined by the coin
   */
  parseTransaction(rawTransaction: any): BaseTransaction;

  /**
   * Build our transaction. Returns the resultant transaction with a completed transaction (or error state)
   * @param transaction
   */
  buildTransaction(transaction: BaseTransaction): BaseTransaction;

  /**
   * Sign a transaction. Creates and attaches a signature to this transaction.
   * @param privateKey the private key associated with this signing mechanism
   * @param transaction our txBuilder's transaction typically
   */
  sign(privateKey: BaseKey, transaction: BaseTransaction): BaseTransaction;

  /**
   * Extends transaction's expiration date by the given number of milliseconds
   * @param transaction The transaction to update
   * @param extensionMs The number of milliseconds to extend the expiration by
   */
  extendTransaction(transaction: BaseTransaction, extensionMs: number): BaseTransaction;
}
