import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey, BaseTransaction, InvalidTransactionError } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { Address } from './address';
import { TransactionBuilder } from './transactionBuilder';
import { KeyPair } from './keyPair';
import { decodeTransaction } from './utils';
import { ContractType } from './enum';
import { ContractCallBuilder } from './contractCallBuilder';
import { TransactionReceipt } from './iface';
import { TokenTransferBuilder } from './tokenTransferBuilder';

/**
 * Wrapped Builder class
 * This builder is created to maintain compatibility with the current uses of account-lib
 * It has an instance of Transaction Builder or Contract Call Builder as required.
 */
export class WrappedBuilder extends TransactionBuilder {
  private _builder: TransactionBuilder;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    // defaults to old builder
    this._builder = new TransactionBuilder(_coinConfig);
  }

  /**
   * Returns a specific builder to create a contract call transaction
   *
   * @param {Transaction} [tx] The transaction to initialize builder
   * @returns {ContractCallBuilder} The specific contract call builder
   */
  getContractCallBuilder(tx?: TransactionReceipt | string): ContractCallBuilder {
    return this.initializeBuilder(tx, new ContractCallBuilder(this._coinConfig));
  }

  getTransactionBuilder(tx?: TransactionReceipt | string): TransactionBuilder {
    return this.initializeBuilder(tx, new TransactionBuilder(this._coinConfig));
  }

  getTokenTransferBuilder(tx?: TransactionReceipt | string): TokenTransferBuilder {
    return this.initializeBuilder(tx, new TokenTransferBuilder(this._coinConfig));
  }

  private initializeBuilder<T extends TransactionBuilder>(tx: TransactionReceipt | string | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }

  /** @inheritdoc */
  extendValidTo(extensionMs: number) {
    this._builder.extendValidTo(extensionMs);
  }

  /** @inheritdoc */
  sign(key: BaseKey) {
    this._builder.sign(key);
  }

  /** @inheritdoc */
  async build(): Promise<BaseTransaction> {
    return this._builder.build();
  }

  /** @inheritdoc */
  from(raw: any) {
    this.validateRawTransaction(raw);
    const rawDataHex = this.getTxReceipt(raw);
    const decodedTx = decodeTransaction(rawDataHex);
    const contractType = decodedTx.contractType;
    switch (contractType) {
      case ContractType.Transfer:
      case ContractType.AccountPermissionUpdate:
        this._builder = this.getTransactionBuilder(raw);
        return this._builder;
      case ContractType.TriggerSmartContract:
        return this.getContractCallBuilder(raw);
      default:
        throw new InvalidTransactionError('Invalid transaction type: ' + contractType);
    }
  }

  /**
   * Get the raw data hex from a raw transaction
   *
   * @param {string | { [key: string]: any }} raw the raw transaction as a string or as an object
   * @returns {string} the raw data hex
   */
  private getTxReceipt(raw: string | { [key: string]: any }): string {
    return raw['raw_data_hex'] || this.getTxReceipt(JSON.parse(raw as string));
  }

  /** @inheritdoc */
  validateAddress(address: Address): void {
    this._builder.validateAddress(address);
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    try {
      new KeyPair({ prv: key.key });
    } catch (err) {
      throw new Error('The provided key is not valid');
    }
  }
  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    this._builder.validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    this._builder.validateTransaction(transaction);
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    this._builder.validateValue(value);
  }
}
