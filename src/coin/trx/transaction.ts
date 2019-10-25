import {RawData, TransactionReceipt, TransferContract} from "./iface";
import { BaseCoin as CoinConfig } from "@bitgo/statics";
import { BaseTransaction } from "../../transaction";
import { decodeTransaction } from "./utils";
import { ContractType} from "./enum";
import BigNumber from "bignumber.js";
import { ParseTransactionError } from "../baseCoin/errors";
import { TransactionType } from "../baseCoin/enum";
import {BaseKey} from "../baseCoin/iface";

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
      const senderAddress = {
        address: this._decodedRawDataHex.contract.ownerAddress
      };
      this._fromAddresses = [senderAddress];

      this._validFrom = this._decodedRawDataHex.timestamp;
      this._validTo = this._decodedRawDataHex.expiration;

      // Destination depends on the contract type
      this.recordRawDataFields(this._decodedRawDataHex);
    }
  }

  /**
   * Parse the transaction raw data and record the most important fields.
   * @param rawData Object from a tron transaction
   */
  private recordRawDataFields(rawData: RawData) {
    switch (rawData.contractType) {
      case ContractType.Transfer:
        this._type = TransactionType.Send;
        const destination = {
          address: (rawData.contract as TransferContract).toAddress,
          value: new BigNumber((rawData.contract as TransferContract).amount),
        };
        this._destination = [destination];
        break;
      default:
        throw new ParseTransactionError('Unsupported contract type');
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
