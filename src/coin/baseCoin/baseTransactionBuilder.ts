import { BaseAddress, BaseKey } from "./iface";
import { BaseTransaction } from "./baseTransaction";
import { SigningError } from "./errors";
import BigNumber from "bignumber.js";
import { BaseCoin as CoinConfig } from "@bitgo/statics";

/**
 * Generic transaction builder. It contains the set of default steps (i.e. from, sign, build) and
 * enforces mandatory validations.
 * Should be extended with coin specific steps.
 */
export abstract class BaseTransactionBuilder {

  /**
   * Base constructor.
   * @param _coinConfig BaseCoin from statics library
   */
  protected constructor(protected _coinConfig: Readonly<CoinConfig>) { }

  /**
   * Parse a transaction based on existing data. The input format is determined by the coin
   * extending this class. Some examples are hex, base64, or JSON.
   * @param rawTransaction
   */
  from(rawTransaction: any): void {
    this.validateRawTransaction(rawTransaction);
    this.transaction = this.fromImplementation(rawTransaction);
  }

  /**
   * Coin specific implementation of {@code from}
   * @see from
   * @return the parsed coin specific transaction object
   */
  protected abstract fromImplementation(rawTransaction: any): BaseTransaction;

  /**
   * Validate keys and sign the transaction.
   * @param key one of the keys associated with this transaction
   */
  sign(key: BaseKey): void {
    // Make sure the key is valid
    this.validateKey(key);
    if (!this.transaction.canSign(key)) {
      throw new SigningError('Private key cannot sign the transaction');
    }
    this.transaction = this.signImplementation(key);
  }

  /**
   * Coin specific implementation of {@code sign}
   * @see sign
   * @return the signed coin specific transaction object
   */
  protected abstract signImplementation(key: BaseKey): BaseTransaction;

  /**
   * Finalize the transaction by performing any extra step like calculating hashes, verifying
   * integrity, or adding default values.
   * @return transaction object
   */
  build(): BaseTransaction {
    this.validateTransaction(this.transaction);
    return this.buildImplementation();
  }

  /**
   * Coin specific implementation of {@code build}
   * @return the final coin specific transaction object
   */
  protected abstract buildImplementation(): BaseTransaction;

  /**
   * The statics fullName of this coin
   */
  abstract displayName(): string;

  /**
   * Validates a private key.
   */
  abstract validateKey(key: BaseKey);

  /**
   * Validate an address. Throws an exception if invalid.
   * @param address the address
   * @param addressFormat the address format - this will be handled by the implementing coin as an
   *     enum
   */
  abstract validateAddress(address: BaseAddress, addressFormat?: string);

  /***
   * Validates the value corresponding to an amount can be used for this transaction. Throws an
   * exception if invalid.
   */
  abstract validateValue(value: BigNumber);

  /**
   * Validates the raw transaction has the coin specific correct format, throws otherwise.
   */
  abstract validateRawTransaction(rawTransaction: any);

  /**
   * Validates the transaction has all mandatory fields before and are correct, throws otherwise.
   */
  abstract validateTransaction(transaction: BaseTransaction);

  /**
   * Get the transaction being built.
   */
  protected abstract get transaction(): BaseTransaction;

  /**
   * Set the transaction being built.
   */
  protected abstract set transaction(transaction: BaseTransaction);
}
