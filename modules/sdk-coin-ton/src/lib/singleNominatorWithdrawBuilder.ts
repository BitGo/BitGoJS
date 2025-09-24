import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Recipient, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';

export class SingleNominatorWithdrawBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.SingleNominatorWithdraw;
  }

  setWithdrawAmount(amount: string): SingleNominatorWithdrawBuilder {
    this.transaction.withdrawAmount = amount;
    return this;
  }

  send(recipient: Recipient): SingleNominatorWithdrawBuilder {
    this.transaction.recipient = recipient;
    return this;
  }

  setMessage(msg: string): SingleNominatorWithdrawBuilder {
    throw new Error('Method not implemented.');
  }
}
