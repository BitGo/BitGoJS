import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Recipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { Transaction } from '../transaction/transaction';
import utils from '../utils';
import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { GasData } from '../types';
import { TransactionPayload } from '@aptos-labs/ts-sdk';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  // get and set region
  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this._transaction = tx;
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
   * Sets the sender of this transaction.
   *
   * @param {string} senderAddress the account that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  sender(senderAddress: string): this {
    this.validateAddress({ address: senderAddress });
    this.transaction.sender = senderAddress;
    return this;
  }

  recipient(recipient: Recipient): this {
    this.validateAddress({ address: recipient.address });
    this.validateValue(new BigNumber(recipient.amount));
    this.transaction.recipient = recipient;
    return this;
  }

  gasData(gasData: GasData): this {
    this.validateGasData(gasData);
    this.transaction.maxGasAmount = gasData.maxGasAmount;
    this.transaction.gasUnitPrice = gasData.gasUnitPrice;
    this.transaction.gasUsed = gasData.gasUsed ?? 0;
    return this;
  }

  sequenceNumber(seqNo: number): TransactionBuilder {
    this.transaction.sequenceNumber = seqNo;
    return this;
  }

  expirationTime(expTimeSec: number): TransactionBuilder {
    this.transaction.expirationTime = expTimeSec;
    return this;
  }

  abstract assetId(assetId: string): TransactionBuilder;

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  addSenderSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this.transaction.addSenderSignature(publicKey, signature);
  }

  addFeePayerSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this.transaction.addFeePayerSignature(publicKey, signature);
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    this.transaction.fromRawTransaction(rawTransaction);
    this.transaction.transactionType = this.transactionType;
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.transactionType = this.transactionType;
    await this.transaction.build();
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

  protected abstract isValidTransactionPayload(payload: TransactionPayload);

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    this.validateAddress({ address: transaction.sender });
    this.validateAddress({ address: transaction.recipient.address });
    this.validateValue(new BigNumber(transaction.recipient.amount));
  }

  isValidRawTransaction(rawTransaction: string): boolean {
    try {
      const signedTxn = utils.deserializeSignedTransaction(rawTransaction);
      const rawTxn = signedTxn.raw_txn;
      const senderAddress = rawTxn.sender.toString();
      return utils.isValidAddress(senderAddress) && this.isValidTransactionPayload(rawTxn.payload);
    } catch (e) {
      console.error('invalid raw transaction', e);
      return false;
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    if (!this.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isNaN()) {
      throw new BuildTransactionError('Invalid amount format');
    } else if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  private validateGasData(gasData: GasData): void {
    this.validateValue(new BigNumber(gasData.maxGasAmount));
    this.validateValue(new BigNumber(gasData.gasUnitPrice));
  }

  addFeePayerAddress(address: string): void {
    this.transaction.addFeePayerAddress(address);
  }

  getFeePayerPubKey(): string {
    return this.transaction.getFeePayerPubKey();
  }
}
