import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseAddress, BaseKey, PublicKey, ValidityWindow } from './iface';
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
   * Adds a signature to the transaction.
   *
   * @param publicKey public key that produced the signature
   * @param signature raw signature as a hex encoded Buffer
   */
  addSignature(publicKey: PublicKey, signature: Buffer): void {
    throw new SigningError(`${this.coinName()} does not support adding signatures directly.`);
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
  protected abstract buildImplementation(): Promise<BaseTransaction>;

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
   * Get the underlying coin full name as specified in the statics library.
   */
  coinName(): string {
    return this._coinConfig.name;
  }

  /**
   * Verified validity windows params if them exist and return a valid validity windows.
   * Unit param must be specified
   * If params are not consistent, default params will be return based on firstValid and minDuration
   * @param {ValidityWindow} params validity windows parameters to validate.
   * @param {String} params.unit Parameter that could be 'blockheight' or 'timestamp'
   * @param {Number} [params.minDuration] Optional - Minimum duration of the window
   * @param {Number} [params.maxDuration] Optional - Maximum duration of the window
   * @param {Number} [params.firstValid] Optional - First valid value
   * @param {Number} [params.lastValid] Optional - Last valid value
   * @returns {ValidityWindow} verified validity windows or default values
   */
  getValidityWindow(params: ValidityWindow): ValidityWindow {
    if (!params.unit || (params.unit !== 'timestamp' && params.unit !== 'blockheight')) {
      throw new Error('Unit parameter must be specified as blockheight or timestamp');
    }
    const unit = params.unit;
    let defaultMinDuration: number;
    let defaultMaxDuration: number;
    let defaultFirstValid: number;
    let defaultLastValid: number;

    /* Set Default Params
      minimum duration is set as 1 hr (3600000 msec) if unit is timestamp or 20 blocks if it is blockheight
      maximum duration is set as 1 year (31536000000 msec) if unit is timestamp or 1000000 blocks if it is blockheight.
     */
    if (unit === 'timestamp') {
      defaultMinDuration = 0;
      defaultMaxDuration = 31536000000;
      defaultFirstValid = Date.now();
      defaultLastValid = defaultFirstValid + defaultMaxDuration;
    } else {
      defaultMinDuration = 0;
      defaultMaxDuration = 1000000;
      defaultFirstValid = 0;
      defaultLastValid = defaultFirstValid + defaultMaxDuration;
    }

    // If any params exist, they will be used, otherwise it will be used default params.
    let firstValid: number = params.firstValid || defaultFirstValid;
    let lastValid: number = params.lastValid || defaultLastValid;
    let minDuration: number = params.minDuration || defaultMinDuration;
    let maxDuration: number = params.maxDuration || defaultMaxDuration;

    /* Validate Params:
      minDuration < maxDuration
      firstValid < lastValid
      firstValid + minDuration <= lastValid <= firstValid + maxDuration
     */
    if (minDuration >= maxDuration) {
      throw new Error(`Expected maxDuration (${maxDuration}) to be grather than minDuration (${minDuration})`);
    }
    firstValid = firstValid >= 0 ? firstValid : defaultFirstValid;
    minDuration = minDuration >= 0 ? minDuration : defaultMinDuration;
    maxDuration = maxDuration > minDuration ? maxDuration : defaultMaxDuration;
    lastValid =
      lastValid >= firstValid + minDuration && lastValid <= firstValid + maxDuration
        ? lastValid
        : firstValid + maxDuration;

    return {
      firstValid,
      lastValid,
      minDuration,
      maxDuration,
      unit,
    };
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
