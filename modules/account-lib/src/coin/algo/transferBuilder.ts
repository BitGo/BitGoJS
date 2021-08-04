import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import algosdk from 'algosdk';
import { BaseAddress } from '../baseCoin/iface';
import { InvalidTransactionError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransferTransactionSchema } from './txnSchema';
import Utils from './utils';

export class TransferBuilder extends TransactionBuilder {
  protected _to: string;
  protected _amount: number | bigint;
  protected _closeRemainderTo?: string;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  protected buildAlgoTxn(): algosdk.Transaction {
    return algosdk.makePaymentTxnWithSuggestedParams(
      this._sender,
      this._to,
      this._amount,
      this._closeRemainderTo,
      this._note,
      this.suggestedParams,
      this._reKeyTo,
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

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

  validateRawTransaction(rawTransaction: Uint8Array | string): void {
    const { txn: algoTxn } = Utils.decodeAlgoTxn(rawTransaction);

    if (algoTxn.type !== algosdk.TransactionType.pay) {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${algoTxn.type}. Expected ${algosdk.TransactionType.pay}`,
      );
    }
  }

  validateTransaction(transaction: Transaction): void {
    super.validateTransaction(transaction);
    const validationResult = TransferTransactionSchema.validate({
      to: this._to,
      amount: this._amount,
      closeRemainderTo: this._closeRemainderTo,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
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
  amount(amount: number | bigint): this {
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
}
