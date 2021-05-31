import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import algosdk from 'algosdk';
import { BaseAddress } from '../baseCoin/iface';
import { InvalidParameterValueError, BuildTransactionError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';

export class TransferBuilder extends TransactionBuilder {
  protected _to: string;
  protected _amount: number | bigint;
  protected _closeRemainderTo?: string;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.setAlgoTransaction(
      algosdk.makePaymentTxnWithSuggestedParams(
        this._sender,
        this._to,
        this._amount,
        this._closeRemainderTo,
        this._note,
        this.suggestedParams,
        this._reKeyTo,
      ),
    );
    this.transaction.setTransactionType(TransactionType.Send);
    return await super.buildImplementation();
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    const algoTx = tx.getAlgoTransaction();
    if (algoTx) {
      this.amount(algoTx.amount);
      this.to({ address: algosdk.encodeAddress(algoTx.to.publicKey) });
      if (algoTx.closeRemainderTo) {
        this.closeRemainderTo({ address: algosdk.encodeAddress(algoTx.closeRemainderTo.publicKey) });
      }
    }

    return tx;
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    super.validateTransaction(transaction);
    this.validateMandatoryFields();
  }

  /**
   * Sets the payment receiver.
   *
   * @param {BaseAddress} to The receiver account
   * @returns {TransferBuilder} This transfer builder.
   *
   */
  to(to: BaseAddress): this {
    this.validateAddress(to);
    this._to = to.address;

    return this;
  }

  /**
   * Sets the amount of payment.
   *
   * @param {number} amount The amount of payment.
   * @returns {TransferBuilder} This transfer builder.
   */
  amount(amount?: number | bigint): this {
    if (!amount) {
      throw new InvalidParameterValueError('Amount should not be undefined');
    }
    this.validateValue(new BigNumber(amount.toString()));
    this._amount = amount;

    return this;
  }

  /**
   * Sets address to transfer remainder amount on closing.
   *
   * @param {BaseAddress} closeRemainderTo The address for receiving remainder amount
   * @returns {TransferBuilder} This transfer builder.
   *
   */
  closeRemainderTo(closeRemainderTo: BaseAddress): this {
    this.validateAddress(closeRemainderTo);
    this._closeRemainderTo = closeRemainderTo.address;

    return this;
  }

  private validateMandatoryFields(): void {
    if (!this._to) {
      throw new BuildTransactionError('Invalid transaction: missing to');
    }
    this.validateAddress({ address: this._to });
    if (!this._amount) {
      throw new BuildTransactionError('Invalid transaction: missing amount');
    }
    this.validateValue(new BigNumber(this._amount.toString()));
  }
}
