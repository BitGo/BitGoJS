import BigNumber from 'bignumber.js';
import {
  BaseKey,
  BaseTransactionBuilder,
  BaseAddress,
  BuildTransactionError,
  Recipient,
  TransactionType,
  PublicKey,
  ParseTransactionError,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from '../transaction/transaction';
import utils from '../utils';
import { TransactionClause } from '@vechain/sdk-core';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected abstract get transactionType(): TransactionType;

  getNonce(): number {
    return this.transaction.nonce;
  }

  initBuilder(tx: Transaction): void {
    this._transaction = tx;
  }

  /** @inheritdoc */
  get transaction(): Transaction {
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

  recipients(recipients: Recipient[]): this {
    for (const recipient of recipients) {
      this.validateAddress({ address: recipient.address });
      this.validateValue(new BigNumber(recipient.amount));
    }
    this.transaction.recipients = recipients;
    return this;
  }

  gas(g: number): this {
    this.validateValue(new BigNumber(g));
    this.transaction.gas = g;
    return this;
  }

  nonce(n: number): this {
    this.transaction.nonce = n;
    return this;
  }

  expiration(exp: number): this {
    this.transaction.expiration = exp;
    return this;
  }

  dependsOn(dep: string | null): this {
    this.transaction.dependsOn = dep;
    return this;
  }

  blockRef(ref: string): this {
    this.transaction.blockRef = ref;
    return this;
  }

  gasPriceCoef(coef: number): this {
    this.transaction.gasPriceCoef = coef;
    return this;
  }

  /** @inheritDoc */
  addSenderSignature(signature: Buffer): void {
    this.transaction.addSenderSignature(signature);
  }

  addFeePayerSignature(publicKey: PublicKey, signature: Buffer): void {
    this.transaction.addFeePayerSignature(publicKey, signature);
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    this.transaction.fromRawTransaction(rawTransaction);
    this.transaction.type = this.transactionType;
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.transaction.build();
    return this.transaction;
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  protected abstract isValidTransactionClauses(clauses: TransactionClause[]): boolean;

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    this.validateAddress({ address: transaction.sender });
    for (const recipient of transaction.recipients) {
      this.validateAddress({ address: recipient.address });
      this.validateValue(new BigNumber(recipient.amount));
    }
  }

  isValidRawTransaction(rawTransaction: string): boolean {
    try {
      const tx = utils.deserializeTransaction(rawTransaction);
      return this.isValidTransactionClauses(tx.body.clauses);
    } catch (e) {
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

  validateValue(value: BigNumber): void {
    if (value.isNaN()) {
      throw new BuildTransactionError('Invalid amount format');
    } else if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  private validateGas(gas: number): void {
    this.validateValue(new BigNumber(gas));
  }

  addFeePayerAddress(address: string): void {
    this.transaction.feePayerAddress = address;
  }

  getFeePayerPubKey(): string {
    return this.transaction.getFeePayerPubKey();
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new Error('Method not implemented');
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new Error('Method not implemented.');
  }
}
