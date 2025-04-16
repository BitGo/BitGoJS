import { createHash } from 'crypto';
import * as _ from 'lodash';
import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  InvalidTransactionError,
  ParseTransactionError,
  SigningError,
  ExtendTransactionError,
  InvalidParameterValueError,
} from '@bitgo/sdk-core';
import { TransactionReceipt, Block } from './iface';
import { Address } from './address';
import {
  signTransaction,
  isBase58Address,
  decodeTransaction,
  VALID_RESOURCE_TYPES,
  getHexAddressFromBase58Address,
  TRANSACTION_MAX_EXPIRATION,
} from './utils';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';

/**
 * Tron transaction builder.
 */
export class TransactionBuilder extends BaseTransactionBuilder {
  // transaction being built
  private _transaction: Transaction;
  protected _ownerAddress: string;
  protected _refBlockBytes: string;
  protected _refBlockHash: string;
  protected _expiration: number;
  protected _timestamp: number;

  /**
   * Public constructor.
   *
   * @param {CoinConfig} _coinConfig Configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
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
   * Set the source address for the transaction
   *
   * @param {Address} address The source address
   * @returns the builder with the new parameter set
   */
  source(address: Address): this {
    this.validateAddress(address);
    this._ownerAddress = getHexAddressFromBase58Address(address.address);
    return this;
  }

  /**
   * Set the timestamp for the transaction
   *
   * @param {number} time the timestamp in milliseconds
   * @returns the builder with the new parameter set
   */
  timestamp(time: number): this {
    this._timestamp = time;
    return this;
  }

  /**
   * Set the block values,
   *
   * @param {Block} block the object containing number and hash of the block
   * @returns the builder with the new parameter set
   */
  block(block: Block): this {
    const blockBytes = Buffer.alloc(8);
    blockBytes.writeInt32BE(block.number, 4);
    this._refBlockBytes = blockBytes.slice(6, 8).toString('hex');
    this._refBlockHash = Buffer.from(block.hash, 'hex').slice(8, 16).toString('hex');

    return this;
  }

  /**
   * Set the expiration time for the transaction, set timestamp if it was not set previously
   *
   * @param {number} time the expiration time in milliseconds
   * @returns the builder with the new parameter set
   */
  expiration(time: number): this {
    if (this.transaction.id) {
      throw new ExtendTransactionError('Expiration is already set, it can only be extended');
    }
    this._timestamp = this._timestamp || Date.now();
    this.validateExpirationTime(time);
    this._expiration = time;
    return this;
  }

  /**
   * Parse transaction takes in raw JSON directly from the node.
   *
   * @param {TransactionReceipt} rawTransaction The Tron transaction in JSON format as returned by the Tron lib or a stringifyed version of such JSON.
   * @returns {Transaction} Tron transaction
   */
  protected fromImplementation(rawTransaction: TransactionReceipt | string): Transaction {
    let tx;
    if (typeof rawTransaction === 'string') {
      const transaction = JSON.parse(rawTransaction);
      tx = new Transaction(this._coinConfig, transaction);
    } else {
      tx = new Transaction(this._coinConfig, rawTransaction);
    }
    return tx;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    if (!this.transaction.inputs) {
      throw new SigningError('Transaction has no sender');
    }

    if (!this.transaction.outputs) {
      throw new SigningError('Transaction has no receiver');
    }
    return this.applySignature(key);
  }

  protected applySignature(key: BaseKey): Transaction {
    const oldTransaction = this.transaction.toJson();
    // Store the original signatures to compare them with the new ones in a later step. Signatures
    // can be undefined if this is the first time the transaction is being signed
    const oldSignatureCount = oldTransaction.signature ? oldTransaction.signature.length : 0;
    let signedTransaction: TransactionReceipt;
    try {
      const keyPair = new KeyPair({ prv: key.key });
      // Since the key pair was generated using a private key, it will always have a prv attribute,
      // hence it is safe to use non-null operator
      signedTransaction = signTransaction(keyPair.getKeys().prv!, this.transaction.toJson());
    } catch (e) {
      throw new SigningError('Failed to sign transaction via helper.');
    }

    // Ensure that we have more signatures than what we started with
    if (!signedTransaction.signature || oldSignatureCount >= signedTransaction.signature.length) {
      throw new SigningError('Transaction signing did not return an additional signature.');
    }

    return new Transaction(this._coinConfig, signedTransaction);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    // This is a no-op since Tron transactions are built from
    if (!this.transaction.id) {
      throw new BuildTransactionError('A valid transaction must have an id');
    }
    return Promise.resolve(this.transaction);
  }

  initBuilder(tx: TransactionReceipt | string) {
    this.transaction = this.fromImplementation(tx);
  }

  /**
   * Extend the validity of this transaction by the given amount of time
   *
   * @param {number} extensionMs The number of milliseconds to extend the validTo time
   * @returns {undefined}
   */
  extendValidTo(extensionMs: number): void {
    this.transaction.extendExpiration(extensionMs);
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThanOrEqualTo(0)) {
      throw new Error('Value cannot be below zero.');
    }

    // max long in Java - assumed upper limit for a TRX transaction
    if (value.isGreaterThan(new BigNumber('9223372036854775807'))) {
      throw new Error('Value cannot be greater than handled by the javatron node.');
    }
  }

  /** @inheritdoc */
  validateAddress(address: Address): void {
    // assumes a base 58 address for our addresses
    if (!isBase58Address(address.address)) {
      throw new Error(address.address + ' is not a valid base58 address.');
    }
  }

  /**
   * Helper method to validate the resource type
   * @param resource The resource type to be validated
   */
  validateResource(resource: string): void {
    if (!VALID_RESOURCE_TYPES.includes(resource)) {
      throw new Error(resource + ' is not a valid resource type.');
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    try {
      new KeyPair({ prv: key.key });
    } catch (err) {
      throw new Error('The provided key is not valid');
    }
  }

  /**
   * Validate the contents of a raw transaction. The validation
   * phase is to compare the raw-data-hex to the raw-data of the
   * transaction.
   *
   * The contents to be validated are
   * 1. The transaction id
   * 2. The expiration date
   * 3. The timestamp
   * 4. The contract
   *
   * @param {TransactionReceipt | string} rawTransaction The raw transaction to be validated
   */
  validateRawTransaction(rawTransaction: TransactionReceipt | string): void {
    // TODO: Validation of signature
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
    let currTransaction: TransactionReceipt;
    // rawTransaction can be either Stringified JSON OR
    // it can be a regular JSON object (not stringified).
    if (typeof rawTransaction === 'string') {
      try {
        currTransaction = JSON.parse(rawTransaction);
      } catch (e) {
        throw new ParseTransactionError('There was error in parsing the JSON string');
      }
    } else if (_.isObject(rawTransaction)) {
      currTransaction = rawTransaction;
    } else {
      throw new InvalidTransactionError('Transaction is not an object or stringified json');
    }
    const decodedRawDataHex = decodeTransaction(currTransaction.raw_data_hex);
    if (!currTransaction.txID) {
      throw new InvalidTransactionError('Transaction ID is empty');
    }
    // Validate the transaction ID from the raw data hex
    const hexBuffer = Buffer.from(currTransaction.raw_data_hex, 'hex');
    const currTxID = createHash('sha256').update(hexBuffer).digest('hex');
    if (currTransaction.txID !== currTxID) {
      throw new InvalidTransactionError('Transaction has not have a valid id');
    }
    // Validate the expiration time from the raw-data-hex
    if (currTransaction.raw_data.expiration !== decodedRawDataHex.expiration) {
      throw new InvalidTransactionError('Transaction has not have a valid expiration');
    }
    // Validate the timestamp from the raw-data-hex
    if (currTransaction.raw_data.timestamp !== decodedRawDataHex.timestamp) {
      throw new InvalidTransactionError('Transaction has not have a valid timetamp');
    }
    // Transaction contract must exist
    if (!currTransaction.raw_data.contract) {
      throw new InvalidTransactionError('Transaction contracts are empty');
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    const hexBuffer = Buffer.from(transaction.toJson().raw_data_hex, 'hex');
    const txId = createHash('sha256').update(hexBuffer).digest('hex');
    if (transaction.id !== txId) {
      throw new InvalidTransactionError(transaction.id + ' is not a valid transaction id. Expecting: ' + txId);
    }
  }

  /**
   * Validate the expiration time of the transaction
   *
   * @param {number} value The expiration time in milliseconds
   * @throws {InvalidParameterValueError} If the expiration time is invalid
   */
  validateExpirationTime(value: number): void {
    if (value < this._timestamp) {
      throw new InvalidParameterValueError('Expiration must be greater than timestamp');
    }

    if (value < Date.now()) {
      throw new InvalidParameterValueError('Expiration must be greater than current time');
    }

    if (value - this._timestamp > TRANSACTION_MAX_EXPIRATION) {
      throw new InvalidParameterValueError('Expiration must not be greater than one day');
    }
  }
}
