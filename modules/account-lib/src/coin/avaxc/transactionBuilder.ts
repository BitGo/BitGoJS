import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { BaseTransactionBuilder } from '../baseCoin';
import { BuildTransactionError, NotImplementedError } from '../baseCoin/errors';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import { Fee } from './iface';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';

export const DEFAULT_M = 3;
export const DEFAULT_N = 2;
export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _source: BaseAddress;
  private _fee: Fee;
  private _transaction: Transaction;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig);
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    throw new NotImplementedError('buildImplementation not implemented');
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    throw new NotImplementedError('fromImplementation not implemented');
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('signImplementation not implemented');
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    throw new NotImplementedError('initBuilder not implemented');
  }

  // endregion

  // region Common builder methods

  /**
   * Set the transaction fees
   *
   * @param {Fee} fee The maximum gas to pay
   * @returns {TransactionBuilder} This transaction builder
   */
  fee(fee: Fee): this {
    this.validateValue(new BigNumber(fee.gasLimit));
    this._fee = fee;
    return this;
  }

  /**
   * Set the transaction source
   *
   * @param {BaseAddress} address The source account
   * @returns {TransactionBuilder} This transaction builder
   */
  source(address: BaseAddress): this {
    this.validateAddress(address);
    this._source = address;
    return this;
  }

  /**
   * Set an external transaction signature
   *
   * @param { string }signature Hex encoded signature string
   * @param { KeyPair }keyPair The public key keypair that was used to create the signature
   * @returns { TransactionBuilder }This transaction builder
   */
  signature(signature: string, keyPair: KeyPair): TransactionBuilder {
    throw new NotImplementedError('initializeBuilder not implemented');
  }

  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress): void {
    throw new NotImplementedError('validateAddress not implemented');
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new NotImplementedError('validateKey not implemented');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    throw new NotImplementedError('validateRawTransaction not implemented');
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    this.validateMandatoryFields();
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  validateMandatoryFields(): void {
    throw new NotImplementedError('validateMandatoryFields not implemented');
  }

  // endregion

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}
