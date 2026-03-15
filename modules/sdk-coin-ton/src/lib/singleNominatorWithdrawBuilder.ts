import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Recipient, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { SINGLE_NOMINATOR_WITHDRAW_ALL_COMMENT } from './constants';

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

  /**
   * Sets the message to withdraw everything from the single nominator contract.
   * Uses a plain transfer with text comment "w" which instructs the contract to
   * drain balance - gas - MIN_TON_FOR_STORAGE automatically.
   */
  setFullWithdrawalMessage(): SingleNominatorWithdrawBuilder {
    this.transaction.isFullUnstake = true;
    this.transaction.message = SINGLE_NOMINATOR_WITHDRAW_ALL_COMMENT;
    return this;
  }

  setMessage(msg: string): SingleNominatorWithdrawBuilder {
    throw new Error('Method not implemented.');
  }
}
