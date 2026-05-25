import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Recipient, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';

export class TonWhalesVestingWithdrawBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }
  protected get transactionType(): TransactionType {
    return TransactionType.TonWhalesVestingWithdrawal;
  }
  setWithdrawMessage(): TonWhalesVestingWithdrawBuilder {
    this.transaction.message = 'Withdraw';
    return this;
  }

  setForwardAmount(amount: string): TonWhalesVestingWithdrawBuilder {
    if (!this.transaction.recipient) {
      this.transaction.recipient = { address: '', amount: amount };
    } else {
      this.transaction.recipient.amount = amount;
    }
    return this;
  }

  send(recipient: Recipient): TonWhalesVestingWithdrawBuilder {
    this.transaction.recipient = recipient;
    return this;
  }
  setMessage(msg: string): TonWhalesVestingWithdrawBuilder {
    throw new Error('Method not implemented. Use setWithdrawMessage() instead.');
  }
}
