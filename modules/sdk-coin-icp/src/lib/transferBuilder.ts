import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { TransactionType, BaseTransaction, BaseAddress } from '@bitgo/sdk-core';
import { Utils } from './utils';
import BigNumber from 'bignumber.js';

export class TransferBuilder extends TransactionBuilder {
  protected _utils: Utils;

  validateValue(value: BigNumber): void {
    throw new Error('Method not implemented.');
  }

  constructor(_coinConfig: Readonly<CoinConfig>, utils: Utils) {
    super(_coinConfig);
    this._utils = utils;
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
