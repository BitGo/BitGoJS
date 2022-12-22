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
import { Transaction } from './transaction';
import utils from './utils';
import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  PayAllSuiTxDetails,
  PaySuiTxDetails,
  PayTx,
  PayTxDetails,
  SuiObjectRef,
  SuiTransaction,
  TxDetails,
} from './iface';
import assert from 'assert';
import { SUI_GAS_PRICE, SuiTransactionType } from './constants';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  private _signatures: Signature[] = [];

  protected _type: SuiTransactionType;
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

  type(type: SuiTransactionType): this {
    this._type = type;
    return this;
  }

  gasBudget(gasBudget: number): this {
    this.validateGasBudget(gasBudget);
    this._gasBudget = gasBudget;
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
    this.sender(txData.sender);
    this.gasPayment(txData.gasPayment);

    let payTx;
    let txDetails: TxDetails = txData.kind.Single;
    if (txDetails.hasOwnProperty('Pay')) {
      this.type(SuiTransactionType.Pay);
      txDetails = txDetails as PayTxDetails;
      payTx = {
        coins: txDetails.Pay.coins,
        recipients: txDetails.Pay.recipients,
        amounts: txDetails.Pay.amounts,
      };
    } else if (txDetails.hasOwnProperty('PaySui')) {
      this.type(SuiTransactionType.PaySui);
      txDetails = txDetails as PaySuiTxDetails;
      payTx = {
        coins: txDetails.PaySui.coins,
        recipients: txDetails.PaySui.recipients,
        amounts: txDetails.PaySui.amounts,
      };
    } else if (txDetails.hasOwnProperty('PayAllSui')) {
      this.type(SuiTransactionType.PayAllSui);
      txDetails = txDetails as PayAllSuiTxDetails;
      payTx = {
        coins: txDetails.PayAllSui.coins,
        recipients: [txDetails.PayAllSui.recipient],
        amounts: [], // PayAllSui deserialization doesn't return the amount
      };
    } else {
      throw new Error('Transaction type not supported: ' + txDetails);
    }
    this.payTx(payTx);
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
    this.validateTransactionFields();

    let payTx;
    if (this._type === SuiTransactionType.PaySui || this._type === SuiTransactionType.PayAllSui) {
      if (!this._gasPayment) {
        this._gasPayment = this._payTx.coins[0];
      } else {
        const inputCoins = this.reorderInputCoins();
        payTx = { coins: inputCoins, recipients: this._payTx.recipients, amounts: this._payTx.amounts };
      }
    }

    return {
      type: this._type,
      sender: this._sender,
      payTx: payTx ?? this._payTx,
      gasBudget: this._gasBudget,
      gasPrice: this._gasPrice,
      gasPayment: this._gasPayment,
    };
  }

  // Reorder input coins so the first coin is the gas payment
  reorderInputCoins(): SuiObjectRef[] {
    const coinIds = this._payTx.coins.map((coin) => coin.objectId);
    const inputCoins: SuiObjectRef[] = [];
    inputCoins.push(...this._payTx.coins);
    if (!coinIds.includes(this._gasPayment.objectId)) {
      inputCoins.unshift(this._gasPayment);
    } else {
      const gasPaymentIndex = inputCoins.findIndex((coin) => coin.objectId === this._gasPayment.objectId);
      inputCoins[gasPaymentIndex] = inputCoins[0];
      inputCoins[0] = this._gasPayment;
    }

    return inputCoins;
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

    if (this._type !== SuiTransactionType.PayAllSui && payTx.recipients.length !== payTx.amounts.length) {
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
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._payTx, new BuildTransactionError('payTx is required before building'));
    assert(this._gasBudget, new BuildTransactionError('gasBudget is required before building'));

    if (this._type === SuiTransactionType.Pay) {
      assert(this._gasPayment, new BuildTransactionError('gasPayment is required for type Pay before building'));

      const coinIds = this._payTx.coins.map((coin) => coin.objectId);
      if (coinIds.includes(this._gasPayment.objectId) && this._type === SuiTransactionType.Pay) {
        throw new BuildTransactionError(
          `Invalid gas payment ${this._gasPayment.objectId}: cannot be one of the inputCoins`
        );
      }
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
