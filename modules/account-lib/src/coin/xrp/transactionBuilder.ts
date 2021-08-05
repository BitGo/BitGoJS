import BigNumber from 'bignumber.js';
import RippleAddressCodec from 'ripple-address-codec';
import RippleBinaryCodec from 'ripple-binary-codec';
import { ApiMemo } from 'ripple-lib/dist/npm/transaction/utils';
import * as rippleTypes from 'ripple-lib/dist/npm/transaction/types';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilder, TransactionType } from '../baseCoin';
import { InvalidTransactionError, NotImplementedError } from '../baseCoin/errors';
import { BaseAddress, BaseFee, BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';
import { AddressValidationError } from './errors';
import { KeyPair } from './keyPair';
export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  protected _keyPairs: KeyPair[];

  protected _account: string;
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
    this._account = sender.address;
    this._transaction.sender(sender.address);
    return this;
  }

  // transactionType(type: string): this {
  //   this._transactionType = type;
  //   return this;
  // }

  flags(flags: number): this {
    this._flags = flags;
    return this;
  }

  fulfillment(fullfillment: string): this {
    this._fulfillment = fullfillment;
    return this;
  }

  lastLedgerSequence(lastLedgerSeq: number): this {
    this._lastLedgerSequence = lastLedgerSeq;
    return this;
  }

  sequence(sequence: number): this {
    this._sequence = sequence;
    return this;
  }

  memos(memos: { Memo: ApiMemo }[]): this {
    this._memos = memos;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.setXRPTransaction(this.buildXRPTxn());
    this.transaction.setTransactionType(this.transactionType);
    this.transaction.sign(this._keyPairs);
    return this._transaction;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
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
    this.fee({ fee: decodedXrpTrx.Fee as string });
    this.lastLedgerSequence(decodedXrpTrx.LastLedgerSequence as number);
    this.sequence(decodedXrpTrx.Sequence as number);

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
  validateAddress({ address }: BaseAddress): void {
    if (!RippleAddressCodec.isValidClassicAddress(address) || !RippleAddressCodec.isValidXAddress(address)) {
      throw new AddressValidationError(address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new NotImplementedError('validateKey not implemented');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    throw new NotImplementedError('validateRawTransaction not implemented');
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    throw new NotImplementedError('validateTransaction not implemented');
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    throw new NotImplementedError('validateValue not implemented');
  }
  // endregion
}
