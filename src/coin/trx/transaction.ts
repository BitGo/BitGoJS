import { protocol } from '../../../resources/trx/protobuf/tron';
const crypto = require('crypto');
import {RawData, TransactionReceipt, TransferContract, ValueFields} from "./iface";
import { BaseCoin as CoinConfig } from "@bitgo/statics";
import { BaseTransaction } from "../../transaction";
import { decodeTransaction } from "./utils";
import { ContractType} from "./enum";
import BigNumber from "bignumber.js";
import { ParseTransactionError, ExtendTransactionError } from "../baseCoin/errors";
import { TransactionType } from "../baseCoin/";
import { BaseKey } from "../baseCoin/iface";

export class Transaction extends BaseTransaction {
  private _decodedRawDataHex: RawData;
  private _transaction?: TransactionReceipt;

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

    let destination, senderAddress;
    // Contract-specific fields
    switch (rawData.contractType) {
      case ContractType.Transfer:
        this._type = TransactionType.Send;
        destination = {
          address: (rawData.contract[0] as TransferContract).parameter.value.to_address,
          value: new BigNumber((rawData.contract[0] as TransferContract).parameter.value.amount),
        };
        senderAddress = {
          address: (rawData.contract[0] as TransferContract).parameter.value.owner_address
        };
        break;
      case ContractType.AccountPermissionUpdate:
        destination = {
          address: (rawData.contract as any).owner_address,
          value: new BigNumber(0)
        };
        senderAddress = {
          address: (rawData.contract as any).owner_address,
        };
        break;
      default:
        throw new ParseTransactionError('Unsupported contract type');
    }
    this._fromAddresses = [senderAddress];
    this._destination = [destination];
  }

  /**
   * Updates the txid of this transaction after a protobuf update
   * Every time protobuf is updated, we need to update the txid
   */
  private updateTxid(): void {
    if (!this._transaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    const hexBuffer = Buffer.from(this._transaction.raw_data_hex, 'hex');
    const newTxid = crypto.createHash('sha256').update(hexBuffer).digest('hex');
    this._transaction.txID = newTxid;
    this._id = newTxid;
  }

  /**
   * Extends this transaction's expiration date by the given number of milliseconds
   * @param extensionMs The number of milliseconds to extend the expiration by
   */
  extendExpiration(extensionMs: number): void {
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
      const newExpiration = (new BigNumber(raw.expiration).plus(extensionMs)).toNumber();
      raw.expiration = newExpiration;
      const newRawDataHex = Buffer.from(protocol.Transaction.raw.encode(raw).finish()).toString('hex');
      // Set the internal variables to account for the new expiration date
      this._transaction.raw_data_hex = newRawDataHex;
      this._transaction.raw_data.expiration = newExpiration;
      this._decodedRawDataHex = decodeTransaction(newRawDataHex);
      this.recordRawDataFields(this._decodedRawDataHex);
      this.updateTxid();
    } catch (e) {
      throw new ExtendTransactionError('There was an error decoding the initial raw_data_hex from the serialized tx.');
    }
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
