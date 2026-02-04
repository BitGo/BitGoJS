import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Recipient, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';

export class TonWhalesVestingDepositBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }
  protected get transactionType(): TransactionType {
    return TransactionType.TonWhalesVestingDeposit;
  }
  setDepositMessage(): TonWhalesVestingDepositBuilder {
    this.transaction.message = 'Deposit';
    return this;
  }

  setDepositAmount(amount: string): TonWhalesVestingDepositBuilder {
    if (!this.transaction.recipient) {
      this.transaction.recipient = { address: '', amount: amount };
    } else {
      this.transaction.recipient.amount = amount;
    }
    return this;
  }

  send(recipient: Recipient): TonWhalesVestingDepositBuilder {
    this.transaction.recipient = recipient;
    return this;
  }
  setMessage(msg: string): TonWhalesVestingDepositBuilder {
    throw new Error('Method not implemented. Use setDepositMessage() instead.');
  }
}
