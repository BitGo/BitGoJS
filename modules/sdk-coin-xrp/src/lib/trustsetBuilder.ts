import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { IssuedCurrencyAmount, TrustSet } from 'xrpl';
import { XrpTransactionType } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class TrustSetBuilder extends TransactionBuilder {
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

    const { amount } = tx.toJson();
    if (!amount) {
      throw new BuildTransactionError('Missing amount');
    }
    if (!utils.isIssuedCurrencyAmount(amount)) {
      throw new BuildTransactionError('Invalid Limit Amount');
    }
    // The amount is represented in decimal notation, so we need to multiply it by the decimal places
    const amountBigNum = BigNumber(amount.value).shiftedBy(this._coinConfig.decimalPlaces);
    this.amount(amountBigNum.toFixed());
  }

  /**
   *  Set the amount to send
   * @param {string} amount - the amount sent
   * @returns {TransactionBuilder} This transaction builder
   */
  amount(amount: string): TransactionBuilder {
    if (typeof amount !== 'string') {
      throw new Error(`amount type ${typeof amount} must be a string`);
    }
    const amountBigNum = BigNumber(amount);
    if (amountBigNum.lt(0)) {
      throw new Error(`amount ${amount} is not valid`);
    }
    const currency = utils.getXrpCurrencyFromTokenName(this._coinConfig.name);
    // Unlike most coins, XRP Token amounts are represented in decimal notation
    const value = amountBigNum.shiftedBy(-1 * this._coinConfig.decimalPlaces).toFixed();
    this._amount = {
      value: value,
      ...currency,
    };
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (!this._sender) {
      throw new BuildTransactionError('Sender must be set before building the transaction');
    }

    const trustSetFields: TrustSet = {
      TransactionType: this.xrpTransactionType,
      Account: this._sender,
      LimitAmount: this._amount,
    };

    this._specificFields = trustSetFields;

    return await super.buildImplementation();
  }
}
