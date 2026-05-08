import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Recipient, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  send(recipient: Recipient): TransferBuilder {
    this.transaction.recipient = recipient;
    return this;
  }
}
