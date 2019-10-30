import BigNumber from "bignumber.js";

import { RawData, TransactionReceipt } from './iface';
import { Key } from './key';
import { ParseTransactionError, SigningError, BuildTransactionError } from '../baseCoin/errors';
import { Address } from './address';
import { BaseKey } from '../baseCoin/iface';
import { decodeTransaction, isValidHex, signTransaction, isBase58Address } from "./utils";
import { BaseCoin as CoinConfig } from "@bitgo/statics";
import { BaseTransactionBuilder } from "../baseCoin/baseTransactionBuilder";
import { Transaction } from './transaction';

/**
 *
 */
export class TransactionBuilder extends BaseTransactionBuilder {
  // Tron specific transaction being built
  private _transaction: Transaction;

  protected get transaction(): Transaction {
    return this._transaction;
  }

  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /**
   * Tron transaction builder constructor.
   * @param _coinConfig
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Parse transaction takes in raw JSON directly from the node.
   * @param rawTransaction The Tron transaction in JSON format as returned by the Tron lib or a
   *     stringifyed version of such JSON.
   */
  public fromImplementation(rawTransaction: TransactionReceipt | string): Transaction {
    // TODO: add checks to ensure the raw_data, raw_data_hex, and txID are from the same transaction
    if (typeof rawTransaction === 'string') {
      const transaction = JSON.parse(rawTransaction);
      return new Transaction(this._coinConfig, transaction);
    }
    return new Transaction(this._coinConfig, rawTransaction);
  }

  /**
   *
   * @param {Key} key
   * @return {Transaction}
   */
  protected signImplementation(key: BaseKey): Transaction {
    if (!this.transaction.senders) {
      throw new SigningError('transaction has no sender');
    }

    if (!this.transaction.destinations) {
      throw new SigningError('transaction has no receiver');
    }

    const oldTransaction = this.transaction.toJson();
    // store our signatures, since we want to compare the new sig to another in a later step
    const oldSignatureCount = oldTransaction.signature ? oldTransaction.signature.length : 0;
    let signedTx: TransactionReceipt;
    try {
      signedTx = signTransaction(key.key, this.transaction.toJson());
    } catch (e) {
      throw new SigningError('Failed to sign transaction via helper.');
    }

    // ensure that we have more signatures than what we started with
    if (!signedTx.signature || oldSignatureCount >= signedTx.signature.length) {
      throw new SigningError('Transaction signing did not return an additional signature.');
    }

    return new Transaction(this._coinConfig, signedTx);
  }


  public buildImplementation(): Transaction {
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
   * Helper function for parsing a transaction's raw_data field.
   * @param rawDataHex Raw data field encoded as hex in tron.proto
   */
  private createRawTransaction(rawDataHex: string): RawData {
    let parsedTx: RawData;
    try {
      parsedTx = decodeTransaction(rawDataHex);
    } catch (e) {
      throw new ParseTransactionError('Failed to decode transaction: ' + e);
    }

    return parsedTx;
  }

  /**
   * Helper function for parsing a transaction.
   * @param rawTransaction Transaction from the node
   */
  private createTransactionReceipt(rawTransaction: string): TransactionReceipt {
    const raw = JSON.parse(rawTransaction);

    let txID: string;
    // TODO: need a more specific validation method for txID
    if (raw.txID && isValidHex(raw.txID)) {
      txID = raw.txID;
    } else {
      throw new ParseTransactionError('Raw transaction needs to have a valid txID.');
    }

    // this is an optional field - its possible signature is an empty array
    let signature: Array<string> = new Array<string>();
    if (raw.signature && Array.isArray(raw.signature)) {
      signature = raw.signature;
    }

    let rawData: RawData;
    if (raw.raw_data_hex && isValidHex(raw.raw_data_hex)) {
      rawData = this.createRawTransaction(raw.raw_data_hex);
    } else {
      throw new ParseTransactionError('Raw transaction needs to have a valid state.');
    }

    return {
      txID,
      raw_data: rawData,
      raw_data_hex: raw.raw_data_hex,
      signature,
    };
  }

  /**
   * Validates a passed value. This is TRX units.
   */
  public validateValue(value: BigNumber) {
    if (value.isLessThanOrEqualTo(0)) {
      throw new Error('Value cannot be below zero.');
    }

    // max long in Java - assumed upper limit for a TRX transaction
    if (value.isGreaterThan(new BigNumber("9223372036854775807"))) {
      throw new Error('Value cannot be greater than handled by the javatron node.');
    }
  }

  public validateAddress(address: Address) {
    // assumes a base 58 address for our addresses
    if (!isBase58Address(address.address)) {
      throw new Error(address + ' is not a valid base58 address.');
    }
  }

  public validateKey(key: BaseKey) {
    // TODO: determine format for key
    return true;
  }

  public displayName(): string {
    return this._coinConfig.fullName;
  }

  validateRawTransaction(rawTransaction: any) { }

  validateTransaction(transaction: Transaction) { }
}
