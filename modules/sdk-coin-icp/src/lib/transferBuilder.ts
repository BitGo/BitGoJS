import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { TransactionType, BaseTransaction, BaseAddress, BaseKey } from '@bitgo/sdk-core';
import { Utils } from './utils';
import BigNumber from 'bignumber.js';
import { Transaction } from './transaction';

export class TransferBuilder extends TransactionBuilder {
  protected _utils: Utils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: Utils) {
    super(_coinConfig);
    this._utils = utils;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const tx = await super.buildImplementation();
    return tx;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): BaseTransaction {
    const tx = super.signImplementation(key);
    return tx;
  }

  validateValue(value: BigNumber): void {
    throw new Error('Method not implemented.');
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /** @inheritdoc */
  fromImplementation(): BaseTransaction {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  get transaction(): BaseTransaction {
    throw new Error('method not implemented');
  }

  validateAddress(address: BaseAddress, addressFormat?: string): void {
    throw new Error('Method not implemented.');
  }

  validateRawTransaction(rawTransaction: any): void {
    throw new Error('Invalid raw transaction');
  }
}
