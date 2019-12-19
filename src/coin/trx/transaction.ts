import { protocol } from '../../../resources/trx/protobuf/tron';
import * as crypto from 'crypto';
import { RawData, TransactionReceipt, TransferContract } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction } from '../baseCoin';
import { decodeTransaction } from './utils';
import { ContractType } from './enum';
import BigNumber from 'bignumber.js';
import { ParseTransactionError, ExtendTransactionError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin/';
import { BaseKey } from '../baseCoin/iface';

/**
 * Tron transaction model.
 */
export class Transaction extends BaseTransaction {
  // Tron specific fields
  protected _validFrom: number;
  protected _validTo: number;

  private _decodedRawDataHex: RawData;
  private _transaction?: TransactionReceipt;

  /**
   * Tron transaction constructor.
   */
  constructor(coinConfig: Readonly<CoinConfig>, rawTransaction?: TransactionReceipt) {
    super(coinConfig);
    if (rawTransaction) {
      if (!rawTransaction.txID) {
        throw new ParseTransactionError('Transaction has no id');
      }
      this._id = rawTransaction.txID;
      this._transaction = rawTransaction;
      this._decodedRawDataHex = decodeTransaction(rawTransaction.raw_data_hex);

      // Destination depends on the contract type
      this.recordRawDataFields(this._decodedRawDataHex);
    }
  }

  /**
   * Parse the transaction raw data and record the most important fields.
   * @param rawData Object from a tron transaction
   */
  private recordRawDataFields(rawData: RawData) {
    // Contract-agnostic fields
    this._validFrom = rawData.timestamp;
    this._validTo = rawData.expiration;

    let output, input;
    // Contract-specific fields
    switch (rawData.contractType) {
      case ContractType.Transfer:
        this._type = TransactionType.Send;
        const value = new BigNumber((rawData.contract[0] as TransferContract).parameter.value.amount);
        output = {
          address: (rawData.contract[0] as TransferContract).parameter.value.to_address,
          value,
        };
        input = {
          address: (rawData.contract[0] as TransferContract).parameter.value.owner_address,
          value,
        };
        break;
      case ContractType.AccountPermissionUpdate:
        this._type = TransactionType.WalletInitialization;
        output = {
          address: (rawData.contract as any).owner_address,
          value: new BigNumber(0),
        };
        input = {
          address: (rawData.contract as any).owner_address,
          value: new BigNumber(0),
        };
        break;
      default:
        throw new ParseTransactionError('Unsupported contract type');
    }
    this._inputs = [input];
    this._outputs = [output];
  }

  /**
   * Updates the txid of this transaction after a protobuf update
   * Every time protobuf is updated, we need to update the txid
   */
  private updateId(): void {
    if (!this._transaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    const hexBuffer = Buffer.from(this._transaction.raw_data_hex, 'hex');
    const newTxid = crypto
      .createHash('sha256')
      .update(hexBuffer)
      .digest('hex');
    this._transaction.txID = newTxid;
    this._id = newTxid;
  }

  /**
   * Extends this transaction's expiration date by the given number of milliseconds
   * @param extensionMs The number of milliseconds to extend the expiration by
   */
  extendExpiration(extensionMs: number): void {
    if (extensionMs < 0) {
      throw new ExtendTransactionError('Invalid extension range. Must be positive a integer');
    }

    if (!this._transaction) {
      throw new ExtendTransactionError('Empty transaction');
    }

    if (this._transaction.signature && this._transaction.signature.length > 0) {
      throw new ExtendTransactionError('Cannot extend a signed transaction');
    }

    const rawDataHex = this._transaction.raw_data_hex;
    const bytes = Buffer.from(rawDataHex, 'hex');
    let raw;
    try {
      raw = protocol.Transaction.raw.decode(bytes);
      const newExpiration = new BigNumber(raw.expiration).plus(extensionMs).toNumber();
      raw.expiration = newExpiration;
      const newRawDataHex = Buffer.from(protocol.Transaction.raw.encode(raw).finish()).toString('hex');
      // Set the internal variables to account for the new expiration date
      this._transaction.raw_data_hex = newRawDataHex;
      this._transaction.raw_data.expiration = newExpiration;
      this._decodedRawDataHex = decodeTransaction(newRawDataHex);
      this.recordRawDataFields(this._decodedRawDataHex);
      this.updateId();
    } catch (e) {
      throw new ExtendTransactionError('There was an error decoding the initial raw_data_hex from the serialized tx.');
    }
  }

  /**
   * Get the signatures associated with this transaction.
   */
  get signature(): string[] {
    if (!this._transaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    if (this._transaction.signature) {
      return this._transaction.signature;
    }
    return [];
  }

  get validFrom(): number {
    return this._validFrom;
  }

  get validTo(): number {
    return this._validTo;
  }

  /**
   * Tron transaction do not contain the owners account address so it is not possible to check the
   * private key with any but the account main address. This is not enough to fail this check, so it
   * is a no-op.
   */
  canSign(key: BaseKey): boolean {
    return true;
  }

  toJson(): TransactionReceipt {
    if (!this._transaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    return this._transaction;
  }
}
