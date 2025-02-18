import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Recipient, TransactionType, BaseTransaction } from '@bitgo/sdk-core';
import { Utils } from './utils';

export class TransferBuilder extends TransactionBuilder {
  protected _recipients: Recipient[];
  protected utils: Utils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: Utils) {
    super(_coinConfig);
    this.utils = utils;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<BaseTransaction> {
    throw new Error('method not implemented');
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
}
