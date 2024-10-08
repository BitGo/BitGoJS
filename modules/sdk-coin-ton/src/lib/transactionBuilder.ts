import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  FeeOptions,
  PublicKey as BasePublicKey,
  Signature,
  TransactionType,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import utils from './utils';
import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import TonWeb from 'tonweb';

export const WITHDRAW_OPCODE = '00001000';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  private _signatures: Signature[] = [];

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._transaction = new Transaction(coinConfig);
  }

  // get and set region
  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this.transaction.signature[0] = signature.toString('hex');
  }

  /**
   * Sets the sender of this transaction.
   * This account will be responsible for paying transaction fees.
   *
   * @param {string} senderAddress the account that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  sender(senderAddress: string): this {
    this.transaction.sender = senderAddress;
    return this;
  }

  /**
   * Sets the transaction to be bounceable or not.
   *
   * @param {string} bounceable whether the transaction can be bounced
   * @returns {TransactionBuilder} This transaction builder
   */
  bounceable(bounceable: boolean): this {
    this.transaction.bounceable = bounceable;
    return this;
  }

  /**
   * Sets the fromAddress to be in bounceable format or not.
   *
   * @param {string} bounceable whether the address format is bounceable
   * @returns {TransactionBuilder} This transaction builder
   */
  fromAddressBounceable(bounceable: boolean): this {
    this.transaction.fromAddressBounceable = bounceable;
    this.sender(new TonWeb.Address(this.transaction.sender).toString(true, true, bounceable));
    return this;
  }

  /**
   * Sets the toAddress to be in bounceable format or not.
   *
   * @param {string} bounceable whether the address format is bounceable
   * @returns {TransactionBuilder} This transaction builder
   */
  toAddressBounceable(bounceable: boolean): this {
    this.transaction.toAddressBounceable = bounceable;
    this.transaction.recipient.address = new TonWeb.Address(this.transaction.recipient.address).toString(
      true,
      true,
      bounceable
    );
    return this;
  }

  fee(feeOptions: FeeOptions): this {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    this.transaction.transactionType = this.transactionType;
    this.transaction.fromRawTransaction(rawTransaction);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.transactionType = this.transactionType;
    await this.transaction.build();
    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    return;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    this.validateAddress(transaction.recipient);
    this.validateValue(new BigNumber(transaction.recipient.amount));
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  setMessage(msg: string): TransactionBuilder {
    this.transaction.message = msg;
    return this;
  }

  setWithdrawMessage(): TransactionBuilder {
    const queryId = '0000000000000000';
    this.transaction.message = WITHDRAW_OPCODE + queryId + this.transaction.withdrawAmount;
    return this;
  }

  sequenceNumber(number: number): TransactionBuilder {
    this.transaction.seqno = number;
    return this;
  }

  expireTime(number: number): TransactionBuilder {
    this.transaction.expireTime = number;
    return this;
  }

  publicKey(key: string): TransactionBuilder {
    this.transaction.publicKey = key;
    return this;
  }
}
