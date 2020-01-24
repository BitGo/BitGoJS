import * as crypto from 'crypto';
import BigNumber from 'bignumber.js';

import { TransactionReceipt } from './iface';
import { SigningError, BuildTransactionError, InvalidIDError } from '../baseCoin/errors';
import { Address } from './address';
import { BaseKey } from '../baseCoin/iface';
import { signTransaction, isBase58Address } from './utils';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilder } from '../baseCoin';
import { Transaction } from './transaction';
import { KeyPair } from "./keyPair";

/**
 * Tron transaction builder.
 */
export class TransactionBuilder extends BaseTransactionBuilder {
  // transaction being built
  private _transaction: Transaction;

  /**
   * Tron transaction builder constructor.
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Parse transaction takes in raw JSON directly from the node.
   * @param rawTransaction The Tron transaction in JSON format as returned by the Tron lib or a
   *     stringifyed version of such JSON.
   */
  protected fromImplementation(rawTransaction: TransactionReceipt | string): Transaction {
    // TODO: add checks to ensure the raw_data, raw_data_hex, and txID are from the same transaction
    if (typeof rawTransaction === 'string') {
      const transaction = JSON.parse(rawTransaction);
      return new Transaction(this._coinConfig, transaction);
    }
    return new Transaction(this._coinConfig, rawTransaction);
  }

  /**
   * Tron transaction signing implementation.
   */
  protected signImplementation(key: BaseKey): Transaction {
    if (!this.transaction.inputs) {
      throw new SigningError('transaction has no sender');
    }

    if (!this.transaction.outputs) {
      throw new SigningError('transaction has no receiver');
    }

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

  /**
   * Tron transaction building and verification implementation.
   */
  protected buildImplementation(): Transaction {
    // This is a no-op since Tron transactions are built from
    if (!this.transaction.id) {
      throw new BuildTransactionError('A valid transaction must have an id');
    }
    return this.transaction;
  }

  /**
   * Extend the validity of this transaction by the given amount of time
   * @param extensionMs The number of milliseconds to extend the validTo time
   */
  extendValidTo(extensionMs: number) {
    this.transaction.extendExpiration(extensionMs);
  }

  /**
   * Validates a passed value. This is TRX units.
   */
  validateValue(value: BigNumber) {
    if (value.isLessThanOrEqualTo(0)) {
      throw new Error('Value cannot be below zero.');
    }

    // max long in Java - assumed upper limit for a TRX transaction
    if (value.isGreaterThan(new BigNumber('9223372036854775807'))) {
      throw new Error('Value cannot be greater than handled by the javatron node.');
    }
  }

  validateAddress(address: Address) {
    // assumes a base 58 address for our addresses
    if (!isBase58Address(address.address)) {
      throw new Error(address + ' is not a valid base58 address.');
    }
  }

  validateKey(key: BaseKey) {
    // TODO: determine valid key format
    return true;
  }

  validateRawTransaction(rawTransaction: any) {
    // TODO: parse the transaction raw_data_hex and compare it with the raw_data
  }

  /** @inheritDoc Specifically, checks hex underlying transaction hashes to correct transaction ID. */
  validateTransaction(transaction: Transaction) {
    const hexBuffer = Buffer.from(transaction.toJson().raw_data_hex, 'hex');
    const txId = crypto
      .createHash('sha256')
      .update(hexBuffer)
      .digest('hex');
    if (transaction.id != txId) {
      throw new InvalidIDError(transaction.id + ' is not a valid transaction id. Expecting: ' + txId);
    }
  }

  displayName(): string {
    return this._coinConfig.fullName;
  }

  protected get transaction(): Transaction {
    return this._transaction;
  }

  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}
