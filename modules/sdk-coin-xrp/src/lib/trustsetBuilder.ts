import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { XrpTransactionType } from './iface';
import { Amount, IssuedCurrencyAmount, TrustSet } from 'xrpl';
import { Transaction } from './transaction';
import _ from 'lodash';

export class TrustsetBuilder extends TransactionBuilder {
  private _amount: IssuedCurrencyAmount;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.TrustLine;
  }

  protected get xrpTransactionType(): XrpTransactionType.TrustSet {
    return XrpTransactionType.TrustSet;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    const { destination, amount } = tx.toJson();
    if (!destination) {
      throw new BuildTransactionError('Missing destination');
    }
    if (!amount) {
      throw new BuildTransactionError('Missing amount');
    }

    this.amount(amount);
  }

  /**
   *  Set the amount to send
   * @param {string} amount - the amount sent
   * @returns {TransactionBuilder} This transaction builder
   */
  amount(amount: Amount): TransactionBuilder {
    function isIssuedCurrencyAmount(amount: Amount): amount is IssuedCurrencyAmount {
      return (
        !_.isString(amount) &&
        _.isObjectLike(amount) &&
        _.isString(amount.currency) &&
        _.isString(amount.issuer) &&
        _.isString(amount.value)
      );
    }

    if (!isIssuedCurrencyAmount(amount)) {
      throw new Error(`amount type ${typeof amount} must be a IssuedCurrencyAmount type`);
    }
    this._amount = amount;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (!this._sender) {
      throw new BuildTransactionError('Sender must be set before building the transaction');
    }

    const transferFields: TrustSet = {
      TransactionType: this.xrpTransactionType,
      Account: this._sender,
      LimitAmount: this._amount,
    };

    this._specificFields = transferFields;

    return await super.buildImplementation();
  }
}
