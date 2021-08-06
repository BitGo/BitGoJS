import BigNumber from 'bignumber.js';
import RippleBinaryCodec from 'ripple-binary-codec';
import { ApiMemo } from 'ripple-lib/dist/npm/transaction/utils';
import * as rippleTypes from 'ripple-lib/dist/npm/transaction/types';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilder, TransactionType } from '../baseCoin';
import { BuildTransactionError, InvalidTransactionError, NotImplementedError } from '../baseCoin/errors';
import { BaseAddress, BaseFee, BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';
import { AddressValidationError } from './errors';
import { KeyPair } from './keyPair';
import utils from './utils';
import { BaseTransactionSchema } from './txnSchema';
export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  protected _keyPairs: KeyPair[];

  protected _sender: string;
  protected _memos?: { Memo: ApiMemo }[];
  protected _flags?: number;
  protected _fulfillment?: string;
  protected _lastLedgerSequence?: number;
  protected _fee?: string;
  protected _sequence?: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
    this._keyPairs = [];
  }

  /**
   * Sets the fee.
   *
   *
   * @param {BaseFee} feeObj The amount to pay to the fee sink
   * @returns {TransactionBuilder} This transaction builder.
   *
   */
  fee(feeObj: BaseFee): this {
    this.validateValue(new BigNumber(feeObj.fee));
    this._fee = feeObj.fee;
    return this;
  }

  /**
   * Sets the transaction sender.
   *
   * @param {BaseAddress} sender The sender account
   * @returns {TransactionBuilder} This transaction builder.
   *
   */
  sender(sender: BaseAddress): this {
    this.validateAddress(sender);
    this._sender = sender.address;
    this._transaction.sender(sender.address);
    return this;
  }

  flags(flags: number): this {
    this.validateValue(new BigNumber(flags));
    this._flags = flags;
    return this;
  }

  fulfillment(fulfillment: string): this {
    this._fulfillment = fulfillment;
    return this;
  }

  lastLedgerSequence(lastLedgerSeq: number): this {
    this.validateValue(new BigNumber(lastLedgerSeq));
    this._lastLedgerSequence = lastLedgerSeq;
    return this;
  }

  sequence(sequence: number): this {
    this.validateValue(new BigNumber(sequence));
    this._sequence = sequence;
    return this;
  }

  memos(memos: { Memo: ApiMemo }[]): this {
    this._memos = memos;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const tx = this.buildXRPTxn();
    if (this._memos) tx.Memos = this._memos;
    if (this._flags) tx.Flags = this._flags;
    if (this._fulfillment) tx.Fulfillment = this._fulfillment;
    if (this._sequence) tx.Sequence = this._sequence;
    if (this._lastLedgerSequence) tx.LastLedgerSequence = this._lastLedgerSequence;
    if (this._fee) tx.Fee = this._fee;
    this.transaction.setXRPTransaction(tx);
    this.transaction.setTransactionType(this.transactionType);
    this.transaction.sign(this._keyPairs);
    return this._transaction;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /**
   * Builds the xrp transaction.
   */
  protected abstract buildXRPTxn(): rippleTypes.TransactionJSON;

  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const decodedXrpTrx = RippleBinaryCodec.decode(rawTransaction) as rippleTypes.TransactionJSON;

    if (!decodedXrpTrx) {
      throw new InvalidTransactionError('Invalid Raw tx');
    }
    this.sender({ address: decodedXrpTrx.Account });
    if (decodedXrpTrx.Flags) this.flags(decodedXrpTrx.Flags);
    if (decodedXrpTrx.Memos) this.memos(decodedXrpTrx.Memos);
    if (decodedXrpTrx.Fulfillment) this.fulfillment(decodedXrpTrx.Fulfillment);
    if (decodedXrpTrx.Fee) this.fee({ fee: decodedXrpTrx.Fee as string });
    if (decodedXrpTrx.LastLedgerSequence) this.lastLedgerSequence(decodedXrpTrx.LastLedgerSequence as number);
    if (decodedXrpTrx.Sequence) this.sequence(decodedXrpTrx.Sequence as number);

    switch (decodedXrpTrx.TransactionType) {
      case 'Payment':
        this._transaction.setTransactionType(TransactionType.Send);
        break;
      case 'AccountSet':
        this._transaction.setTransactionType(TransactionType.WalletInitialization);
    }

    this._transaction.setXRPTransaction(decodedXrpTrx);

    return this._transaction;
  }

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): Transaction {
    const keyPair = new KeyPair({ prv: key });
    this._keyPairs.push(keyPair);
    return this._transaction;
  }

  /** @inheritdoc */
  validateAddress({ address }: BaseAddress): void {
    if (!utils.isValidAddress(address)) {
      throw new AddressValidationError(address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new NotImplementedError('validateKey not implemented');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    const decodedXrpTrx = RippleBinaryCodec.decode(rawTransaction) as rippleTypes.TransactionJSON;
    this.validateBaseFields(
      decodedXrpTrx.Account,
      decodedXrpTrx.Flags,
      decodedXrpTrx.Memos,
      decodedXrpTrx.Fulfillment,
      decodedXrpTrx.Fee as string,
      decodedXrpTrx.LastLedgerSequence as number,
      decodedXrpTrx.Sequence as number,
    );
  }

  private validateBaseFields(
    sender: string,
    flags?: number,
    memos?: { Memo: ApiMemo }[],
    fulfillment?: string,
    fee?: string,
    lastLedgerSequence?: number,
    sequence?: number,
  ): void {
    const validationResult = BaseTransactionSchema.validate({
      sender,
      flags,
      memos,
      fulfillment,
      fee,
      lastLedgerSequence,
      sequence,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }

  /** @inheritdoc */
  validateTransaction(_?: Transaction): void {
    this.validateBaseFields(
      this._sender,
      this._flags,
      this._memos,
      this._fulfillment,
      this._fee,
      this._lastLedgerSequence,
      this._sequence,
    );
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }
}
