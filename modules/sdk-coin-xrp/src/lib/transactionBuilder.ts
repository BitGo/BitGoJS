import BigNumber from 'bignumber.js';

import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseAddress,
  BaseKey,
  BaseTransaction,
  BaseTransactionBuilder,
  BuildTransactionError,
  SigningError,
  TransactionType,
  xprvToRawPrv,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { Signer } from 'xrpl/dist/npm/models/common';
import XrpUtils from './utils';
import { KeyPair } from './keyPair';
import { XrpTransactions } from './iface';
import * as xrpl from 'xrpl';
import * as _ from 'lodash';

/**
 * XRP transaction builder.
 */
export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _sender: string;
  protected _fee?: string;
  protected _sequence?: number;
  protected _lastLedgerSequence?: number;
  protected _flags?: number = 0;
  protected _signingPubKey?: string;
  protected _signers: Signer[];
  protected _txnSignature?: string;
  protected _specificFields: XrpTransactions;

  protected _isMultiSig?: boolean;

  protected _keyPairs: KeyPair[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig);
    this._keyPairs = [];
    this._signers = [];
  }

  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /**
   * Set the transaction signature type to multi sig.
   **/
  setMultiSig(): TransactionBuilder {
    this._isMultiSig = true;
    return this;
  }

  /**
   * Set the transaction signature type to single sig.
   **/
  setSingleSig(): TransactionBuilder {
    this._isMultiSig = false;
    return this;
  }

  /**
   * Sets the sender of this transaction.
   *
   * @param {string} address the account that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  sender(address: string): TransactionBuilder {
    XrpUtils.validateAddress(address);
    this._sender = address;
    return this;
  }

  sequence(sequence: number): TransactionBuilder {
    XrpUtils.validateSequence(sequence);
    this._sequence = sequence;
    return this;
  }

  fee(fee: string): TransactionBuilder {
    XrpUtils.validateFee(fee);
    this._fee = fee;
    return this;
  }

  flags(flags: number): TransactionBuilder {
    XrpUtils.validateFlags(flags);
    this._flags = flags;
    return this;
  }

  lastLedgerSequence(lastLedgerSequence: number): TransactionBuilder {
    XrpUtils.validateSequence(lastLedgerSequence);
    this._lastLedgerSequence = lastLedgerSequence;
    return this;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this._transaction = tx;
    const txData = tx.toJson();

    if (!_.isUndefined(txData.isMultiSig)) {
      txData.isMultiSig ? this.setMultiSig() : this.setSingleSig();
    }

    this.sender(txData.from);
    if (txData.fee) {
      this.fee(txData.fee);
    }
    if (txData.sequence) {
      this.sequence(txData.sequence);
    }
    if (txData.lastLedgerSequence) {
      this.lastLedgerSequence(txData.lastLedgerSequence);
    }
    if (txData.flags) {
      this.flags(txData.flags);
    }
    this._signers = txData.signers || [];
    this._signingPubKey = txData.signingPubKey;
    this._txnSignature = txData.txnSignature;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): BaseTransaction {
    const tx = new Transaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this.validateKey(key);
    this.checkDuplicatedKeys(key);
    let prv = key.key;
    if (prv.startsWith('xprv')) {
      const rawPrv = xprvToRawPrv(prv);
      prv = new KeyPair({ prv: rawPrv }).getKeys().prv;
    }
    const signer = new KeyPair({ prv: prv });

    this._keyPairs.push(signer);

    return this.transaction;
  }

  private checkDuplicatedKeys(key: BaseKey) {
    const kp = new KeyPair({ prv: key.key }).getKeys();
    this._keyPairs.forEach((keyPair) => {
      if (XrpUtils.compareKeyUsingLowerCase(keyPair.getKeys().prv!, kp.prv!)) {
        throw new SigningError('Repeated sign: ' + key.key);
      }
    });
    this._signers.forEach((signer) => {
      if (XrpUtils.compareKeyUsingLowerCase(signer.Signer.SigningPubKey, kp.pub)) {
        throw new SigningError('Repeated sign: ' + key.key);
      }
    });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.xrpTransaction = this.buildXrpTransaction();
    this.transaction.setTransactionType(this.transactionType);
    this.transaction.loadInputsAndOutputs();
    if (this._keyPairs.length > 0) {
      this.validateIsMultiSig();
      this.transaction.setMultiSigValue(this._isMultiSig!);
      this.transaction.sign(this._keyPairs);
    }
    return this.transaction;
  }

  private buildXrpTransaction() {
    const commonFields: Partial<XrpTransactions> = {
      Account: this._sender,
      Fee: this._fee,
      Sequence: this._sequence,
      Flags: this._flags,
    };

    if (this._signingPubKey) {
      commonFields.SigningPubKey = this._signingPubKey;
    }
    if (this._txnSignature) {
      commonFields.TxnSignature = this._txnSignature;
    }
    if (this._signers.length > 0) {
      commonFields.Signers = this._signers;
    }
    if (this._lastLedgerSequence) {
      commonFields.LastLedgerSequence = this._lastLedgerSequence;
    }

    const tx = Object.assign(commonFields, this._specificFields);
    xrpl.validate(tx as any);
    return tx;
  }

  validateKey(key: BaseKey): void {
    let keyPair: KeyPair;
    try {
      keyPair = new KeyPair({ prv: key.key });
    } catch {
      throw new BuildTransactionError('Invalid key');
    }

    if (!keyPair.getKeys().prv) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  validateAddress(address: BaseAddress): void {
    if (!XrpUtils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  validateRawTransaction(rawTransaction: string): void {
    XrpUtils.validateRawTransaction(rawTransaction);
  }

  validateIsMultiSig(): void {
    if (_.isUndefined(this._isMultiSig)) {
      throw new BuildTransactionError('Signature type is not defined. Please call setMultiSig or setSingleSig.');
    }
  }

  /** @inheritdoc */
  validateTransaction(): void {
    this.validateSender();
    this.validateFee();
    this.validateSequence();
  }

  /**
   * Validates that the sender field is defined
   */
  private validateSender(): void {
    if (this._sender === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing sender');
    }
  }

  /**
   * Validates that the Fee field is defined
   */
  private validateFee(): void {
    if (this._fee === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing fee');
    }
  }

  /**
   * Validates that the Sequence field is defined
   */
  private validateSequence(): void {
    if (this._sequence === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing sequence');
    }
  }

  protected get transaction(): Transaction {
    return this._transaction;
  }
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}
