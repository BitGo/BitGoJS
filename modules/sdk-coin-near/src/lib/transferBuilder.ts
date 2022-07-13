import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey, BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import * as NearAPI from 'near-api-js';
import assert from 'assert';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

export class TransferBuilder extends TransactionBuilder {
  private _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this._amount = tx.nearTransaction.actions[0].transfer.deposit.toString();
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._amount, new BuildTransactionError('amount is required before building transfer'));
    super.actions([NearAPI.transactions.transfer(new BN(this._amount))]);
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.Send);
    return tx;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    const tx = super.signImplementation(key);
    tx.setTransactionType(TransactionType.Send);
    return tx;
  }

  /**
   * Sets the amount of this transaction.
   *
   * @param {string} value the amount to be sent in yocto (1 Near = 1e24 yoctos)
   * @returns {TransactionBuilder} This transaction builder
   */
  public amount(value: string): this {
    this.validateValue(new BigNumber(value));
    this._amount = value;
    return this;
  }
}
