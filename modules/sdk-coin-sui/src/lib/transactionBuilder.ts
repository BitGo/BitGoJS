import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionType,
} from '@bitgo/sdk-core';
import { SuiObjectRef, SuiTransaction, Transaction } from './transaction';
import utils from './utils';
import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { PayTx } from './iface';
import assert from 'assert';

// Need to keep in sync with
// https://github.com/MystenLabs/sui/blob/f32877f2e40d35a008710c232e49b57aab886462/crates/sui-types/src/messages.rs#L338
export const SUI_GAS_PRICE = 1;

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  private _signatures: Signature[] = [];

  protected _sender: string;
  protected _gasBudget: number;
  protected _gasPrice = SUI_GAS_PRICE;
  protected _payTx: PayTx;
  protected _gasPayment: SuiObjectRef;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
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
    this._signatures.push({ publicKey, signature });
    this.transaction.addSignature(publicKey, signature);
  }

  /**
   * Sets the sender of this transaction.
   * This account will be responsible for paying transaction fees.
   *
   * @param {string} senderAddress the account that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  sender(senderAddress: string): this {
    utils.validateAddress(senderAddress, 'sender');
    this._sender = senderAddress;
    return this;
  }

  gasBudget(gasBudget: number): this {
    this.validateGasBudget(gasBudget);
    this._gasBudget = gasBudget;
    return this;
  }

  gasPrice(gasPrice: number): this {
    this.validateGasPrice(gasPrice);
    this._gasPrice = gasPrice;
    return this;
  }

  payTx(payTx: PayTx): this {
    this.validateTxPay(payTx);
    this._payTx = payTx;
    return this;
  }

  gasPayment(gasPayment: SuiObjectRef): this {
    this.validateGasPayment(gasPayment);
    this._gasPayment = gasPayment;
    return this;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this._transaction = tx;
    this._signatures = [tx.suiSignature];
    const txData = tx.toJson();
    this.gasBudget(txData.gasBudget);
    this.gasPrice(txData.gasPrice);
    this.payTx(txData.payTx);
    this.sender(txData.sender);
    this.gasPayment(txData.gasPayment);
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new Transaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    this.transaction.transactionType(this.transactionType);
    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  protected buildSuiTransaction(): SuiTransaction {
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._payTx, new BuildTransactionError('payTx is required before building'));
    assert(this._gasBudget, new BuildTransactionError('gasBudget is required before building'));
    assert(this._gasPrice, new BuildTransactionError('gasPrice is required before building'));
    assert(this._gasPayment, new BuildTransactionError('gasPayment is required before building'));

    return {
      sender: this._sender,
      payTx: this._payTx,
      gasBudget: this._gasBudget,
      gasPrice: this._gasPrice,
      gasPayment: this._gasPayment,
    };
  }

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  validateGasBudget(gasBudget: number): void {
    if (gasBudget <= 0) {
      throw new BuildTransactionError('Invalid gas budget ' + gasBudget);
    }
  }

  validateGasPrice(gasPrice: number): void {
    if (gasPrice !== SUI_GAS_PRICE) {
      throw new BuildTransactionError('Invalid gas price ' + gasPrice);
    }
  }

  validateTxPay(payTx: PayTx): void {
    if (!payTx.hasOwnProperty('coins')) {
      throw new BuildTransactionError(`Invalid payTx, missing coins`);
    }
    if (!payTx.hasOwnProperty('recipients')) {
      throw new BuildTransactionError(`Invalid payTx, missing recipients`);
    }
    if (!payTx.hasOwnProperty('amounts')) {
      throw new BuildTransactionError(`Invalid payTx, missing amounts`);
    }

    if (payTx.recipients.length !== payTx.amounts.length) {
      throw new BuildTransactionError(
        `recipients length ${payTx.recipients.length} must equal to amounts length ${payTx.amounts.length}`
      );
    }
    if (!utils.isValidAmounts(payTx.amounts)) {
      throw new BuildTransactionError('Invalid or missing amounts, got: ' + payTx.amounts);
    }

    for (const coin of payTx.coins) {
      this.validateSuiObjectRef(coin, 'payTx.coin');
    }

    for (const recipient of payTx.recipients) {
      utils.validateAddress(recipient, 'payTx.recipient');
    }
  }

  validateGasPayment(gasPayment: SuiObjectRef): void {
    if (!gasPayment) {
      throw new BuildTransactionError(`Invalid gas Payment: undefined`);
    }
    this.validateSuiObjectRef(gasPayment, 'gasPayment');
  }

  validateSuiObjectRef(suiObjectRef: SuiObjectRef, field: string): void {
    if (!suiObjectRef.hasOwnProperty('objectId')) {
      throw new BuildTransactionError(`Invalid ${field}, missing objectId`);
    }
    if (!suiObjectRef.hasOwnProperty('version') || !utils.isValidAmount(suiObjectRef.version)) {
      throw new BuildTransactionError(`Invalid ${field}, invalid or missing version`);
    }
    if (!suiObjectRef.hasOwnProperty('digest')) {
      throw new BuildTransactionError(`Invalid ${field}, missing digest`);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    if (!utils.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    if (!transaction.suiTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    if (this._sender === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing sender');
    }
    if (this._gasBudget === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing gas budget');
    }
    if (this._gasPrice === undefined || this._gasPrice !== SUI_GAS_PRICE) {
      throw new BuildTransactionError('Invalid transaction: missing/incorrect gas price');
    }
    if (this._payTx === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing payTx');
    }
    if (this._gasPayment === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing gas payment');
    }

    const coinIds = this._payTx.coins.map((coin) => coin.objectId);
    if (coinIds.includes(this._gasPayment.objectId)) {
      throw new BuildTransactionError(
        `Invalid gas Payment ${this._gasPayment.objectId}, cannot be one of the inputCoins`
      );
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }
  // endregion
}
