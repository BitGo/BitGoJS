import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseAddress, BaseKey } from './iface';
import { BaseTransaction } from './baseTransaction';
import { SigningError } from './errors';

/**
 * Generic transaction builder to be extended with coin specific logic.
 * Provide a set of default steps (i.e. from, sign, build) and enforces mandatory validations.
 */
export abstract class BaseTransactionBuilder {
  protected _coinConfig: Readonly<CoinConfig>;
  /**
   * Base constructor.
   *
   * @param _coinConfig BaseCoin from statics library
   */
  protected constructor(_coinConfig: Readonly<CoinConfig>) {
    this._coinConfig = _coinConfig;
  }

  /**
   * Parse a transaction based on existing data. The input format is determined by the coin
   * extending this class. Some examples are hex, base64, or JSON.
   *
   * @param rawTransaction A raw transaction to be parsed
   */
  from(rawTransaction: any): void {
    this.validateRawTransaction(rawTransaction);
    this.transaction = this.fromImplementation(rawTransaction);
  }

  /**
   * Coin specific implementation of {@code from}.
   *
   * @see {@link from}
   * @returns the parsed coin specific transaction object
   */
  protected abstract fromImplementation(rawTransaction: any): BaseTransaction;

  /**
   * Validate keys and sign the transaction.
   *
   * @param key One of the keys associated with this transaction
   */
  sign(key: BaseKey): void {
    this.validateKey(key);
    if (!this.transaction.canSign(key)) {
      throw new SigningError('Private key cannot sign the transaction');
    }
    this.transaction = this.signImplementation(key);
  }

  /**
   * Coin specific implementation of {@code sign}.
   *
   * @see {@link sign}
   * @returns coin specific transaction with signature data
   */
  protected abstract signImplementation(key: BaseKey): BaseTransaction;

  /**
   * Finalize the transaction by performing any extra step like calculating hashes, verifying
   * integrity, or adding default values.
   *
   * @returns valid coin specific transaction (signed or unsigned)
   */
  async build(): Promise<BaseTransaction> {
    this.validateTransaction(this.transaction);
    return this.buildImplementation();
  }

  /**
   * Coin specific implementation of {@code build}.
   *
   * @see {@link build}
   * @returns valid coin specific transaction (signed or unsigned)
   */
  protected abstract async buildImplementation(): Promise<BaseTransaction>;

  /**
   * Check the private key is present and is valid in the blockchain context, throw otherwise.
   *
   * @param {BaseKey} key Private key to validate
   */
  abstract validateKey(key: BaseKey): void;

  /**
   * Check the address provided is valid in the blockchain context, throw otherwise.
   *
   * @param address Address data to be validated
   * @param addressFormat The format the address should be in if more than one is supported
   */
  abstract validateAddress(address: BaseAddress, addressFormat?: string): void;

  /**
   * Check the amount provided is valid in the blockchain context, throw otherwise.
   *
   * @param {BigNumber} value Transaction amount
   */
  abstract validateValue(value: BigNumber): void;

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param rawTransaction Transaction in any format
   */
  abstract validateRawTransaction(rawTransaction: any): void;

  /**
   * Check the transaction mandatory fields per transaction type and ensures it is valid, throw
   * otherwise.
   *
   * @param {BaseTransaction} transaction
   */
  abstract validateTransaction(transaction?: BaseTransaction): void;

  /**
   * Get the underlying coin full name as specified in the statics library.
   */
  displayName(): string {
    return this._coinConfig.fullName;
  }

  /**
   * Get the transaction being built.
   */
  protected abstract get transaction(): BaseTransaction;

  /**
   * Set the transaction being built.
   */
  protected abstract set transaction(transaction: BaseTransaction);
}
