import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Recipient, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TON_WHALES_WITHDRAW_OPCODE } from './constants';

export class TonWhalesWithdrawalBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.TonWhalesWithdrawal;
  }

  /**
   * Sets the payload for the withdrawal request.
   * Structure: OpCode (32) + QueryId (64) + GasLimit (Coins) + UnstakeAmount (Coins)
   * * @param unstakeAmount The amount of NanoTON to unstake (inside payload)
   * @param unstakeAmount The amount to unstake
   * @param queryId Optional custom query ID
   */
  setWithdrawalMessage(unstakeAmount: string, queryId?: string): TonWhalesWithdrawalBuilder {
    const qId = queryId || '0000000000000000';

    this.transaction.withdrawAmount = unstakeAmount;
    this.transaction.message = TON_WHALES_WITHDRAW_OPCODE + qId + unstakeAmount;
    return this;
  }

  /**
   * Sets the message to withdraw EVERYTHING from the pool.
   * This sets the unstakeAmount to "0", which is the specific signal for full withdrawal.
   */
  setFullWithdrawalMessage(queryId?: string): TonWhalesWithdrawalBuilder {
    return this.setWithdrawalMessage('0', queryId);
  }

  /**
   * Sets the value attached to the transaction (The Fees).
   * NOTE: This is NOT the unstake amount. This is the fee paid to the pool
   * to process the request (e.g. withdrawFee + receiptPrice).
   * * @param amount NanoTON amount to attach to the message
   */
  setForwardAmount(amount: string): TonWhalesWithdrawalBuilder {
    if (!this.transaction.recipient) {
      this.transaction.recipient = { address: '', amount: amount };
    } else {
      this.transaction.recipient.amount = amount;
    }
    return this;
  }

  send(recipient: Recipient): TonWhalesWithdrawalBuilder {
    this.transaction.recipient = recipient;
    return this;
  }

  setMessage(msg: string): TonWhalesWithdrawalBuilder {
    throw new Error('Use setWithdrawalMessage for specific payload construction');
  }
}
