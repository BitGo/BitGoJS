import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Recipient, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TON_WHALES_DEPOSIT_OPCODE } from './constants';

export class TonWhalesDepositBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.TonWhalesDeposit;
  }

  setDepositMessage(queryId?: string): TonWhalesDepositBuilder {
    // Deposit payload is just OpCode + QueryId.
    // The Amount is in the transaction value (recipient.amount)
    // The Gas Limit is hardcoded in Transaction.ts build()
    const qId = queryId || '0000000000000000';
    this.transaction.message = TON_WHALES_DEPOSIT_OPCODE + qId;
    return this;
  }

  setDepositAmount(amount: string): TonWhalesDepositBuilder {
    if (!this.transaction.recipient) {
      this.transaction.recipient = { address: '', amount: amount };
    } else {
      this.transaction.recipient.amount = amount;
    }
    return this;
  }

  send(recipient: Recipient): TonWhalesDepositBuilder {
    this.transaction.recipient = recipient;
    return this;
  }

  setMessage(msg: string): TonWhalesDepositBuilder {
    throw new Error('Method not implemented.');
  }
}
