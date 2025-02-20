import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { TransactionType, BaseTransaction, BaseAddress } from '@bitgo/sdk-core';
import { Utils } from './utils';

export class TransferBuilder extends TransactionBuilder {
  protected _utils: Utils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: Utils) {
    super(_coinConfig);
    this._utils = utils;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   */
  initBuilder(): void {
    throw new Error('method not implemented');
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
}
