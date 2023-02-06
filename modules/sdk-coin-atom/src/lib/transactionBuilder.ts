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
import assert from 'assert';
import { AtomTransaction, GasFeeLimitData, MessageData } from './iface';
import { Coin } from '@cosmjs/stargate';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  private _signatures: Signature[] = [];

  protected _type: string;
  protected _signerAddress: string;
  protected _sequence: number;
  protected _sendMessages: MessageData[];
  protected _gasBudget: GasFeeLimitData;

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

  type(type: string): void {
    this._type = type;
  }

  /**
   * Sets the signerAddress of this transaction.
   * This account will be responsible for paying transaction fees.
   *
   * @param {string} signerAddress the account that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  signerAddress(signerAddress: string): this {
    if (!utils.isValidAddress(signerAddress)) {
      throw new Error('transactionBuilder: sender isValidAddress check failed');
    }
    this._signerAddress = signerAddress;
    return this;
  }

  gasBudget(gasBudget: GasFeeLimitData): this {
    this.validateGasBudget(gasBudget);
    this._gasBudget = gasBudget;
    return this;
  }

  /**
   *
   * @param {number} sequence - sequence data for tx signer
   * @returns {TransactionBuilder} This transaction builder
   */
  sequence(sequence: number): this {
    this.validateSequence(sequence);
    this._sequence = sequence;
    return this;
  }

  sendMessages(sendMessages: MessageData[]): this {
    this.validateMessageDataArray(sendMessages);
    this._sendMessages = sendMessages;
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
    this.type(txData.type);
    this.gasBudget(txData.gasBudget);
    this.signerAddress(txData.signerAddress);
    this.sendMessages(txData.sendMessages);
    this.gasBudget(txData.gasBudget);
    this.sequence(txData.sequence);
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
    this.transaction.setAtomTransaction(this.buildAtomTransaction());
    this.transaction.transactionType(this.transactionType);
    return this.transaction;
  }

  protected buildAtomTransaction(): AtomTransaction {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._signerAddress, new BuildTransactionError('signerAddress is required before building'));
    assert(this._sequence >= 0, new BuildTransactionError('sequence is required before building'));
    assert(this._sendMessages, new BuildTransactionError('sendMessages are required before building'));
    assert(this._gasBudget, new BuildTransactionError('gasPrice is required before building'));

    return {
      type: this._type,
      signerAddress: this._signerAddress,
      sequence: this._sequence,
      sendMessages: this._sendMessages,
      gasBudget: this._gasBudget,
    };
  }

  validateAddress(address: BaseAddress, addressFormat?: string): void {
    throw new BuildTransactionError('validateAddress method not yet implemented');
  }

  private validateAmountData(amountArray: Coin[]): void {
    // TODO - make the error messages more descriptive of which amount data is failing
    // Do amount checking by casting to numbers/bignumber and comparing as well
    // for (const amount of amountArray) {
    //   if (!amount.amount) {
    //     throw new BuildTransactionError('Invalid amount: undefined');
    //   }
    //   if (!amount.denom) {
    //     throw new BuildTransactionError('Invalid denom: undefined');
    //   }
    // }
  }

  validateGasBudget(gasBudget: GasFeeLimitData): void {
    if (gasBudget.gas <= 0) {
      throw new BuildTransactionError('Invalid gas limit ' + gasBudget.gas);
    }
    this.validateAmountData(gasBudget.amount);
  }

  private validateMessageDataArray(sendMessages: MessageData[]) {
    for (const msg of sendMessages) {
      this.validateMessageData(msg);
    }
  }

  validateMessageData(messageData: MessageData): void {
    if (!messageData) {
      throw new BuildTransactionError(`Invalid MessageData: undefined`);
    }
    if (!messageData.typeUrl) {
      throw new BuildTransactionError(`Invalid MessageData typeurl: ` + messageData.typeUrl);
    }
    if (!messageData.value.toAddress) {
      throw new BuildTransactionError(`Invalid MessageData value.toAddress: ` + messageData.value.toAddress);
    }
    if (!messageData.value.fromAddress) {
      throw new BuildTransactionError(`Invalid MessageData value.fromAddress: ` + messageData.value.fromAddress);
    }
    this.validateAmountData(messageData.value.amount);
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
    if (!transaction.atomTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    if (this._type === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing type');
    }
    if (this._signerAddress === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing signerAddress');
    }
    if (this._sequence === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing sequence');
    }
    if (this._sendMessages === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing sendMessages');
    }
    if (this._gasBudget === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing gas budget data');
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  private validateSequence(sequence: number) {
    if (sequence < 0) {
      throw new BuildTransactionError('Invalid sequence: less than zero');
    }
  }
}
