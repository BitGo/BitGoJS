import {RawData, TransactionReceipt, TransferContract} from "./iface";
import { AccountNetwork } from "@bitgo/statics";
import { BaseTransaction } from "../../transaction";
import { decodeTransaction } from "./utils";
import { ContractType} from "./enum";
import BigNumber from "bignumber.js";
import { ParseTransactionError } from "../baseCoin/errors";
import { TransactionType } from "../baseCoin/enum";

export class Transaction extends BaseTransaction {
  private _decodedRawDataHex: RawData;
  private _transaction?: TransactionReceipt;

  constructor(network: AccountNetwork, rawTransaction?: TransactionReceipt) {
    super(network);
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

      // Destination depends on the contract type
      switch (this._decodedRawDataHex.contractType) {
        case ContractType.Transfer:
          this._type = TransactionType.Send;
          const destination = {
            address: (this._decodedRawDataHex.contract as TransferContract).toAddress,
            value: new BigNumber((this._decodedRawDataHex.contract as TransferContract).amount),
          };
          this._destination = [destination];
          break;
        default:
          throw new ParseTransactionError('Unsupported contract type');
      }
    }
  }

  get getValidFrom(): number {
    return this._decodedRawDataHex.expiration;
  }

  get getValidTo(): number {
    return this._decodedRawDataHex.timestamp;
  }

  toJson(): TransactionReceipt {
    if (!this._transaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    return this._transaction;
  }
}
