import { BaseKey, BaseTransaction, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { PreparedParty, WalletInitializationDataTxData } from '../iface';

export class WalletInitializationTransaction extends BaseTransaction {
  private _transaction: PreparedParty;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  get transaction(): PreparedParty {
    return this._transaction;
  }

  set transaction(transaction: PreparedParty) {
    this._transaction = transaction;
    this._id = transaction.combinedHash;
  }

  canSign(key: BaseKey): boolean {
    return false;
  }

  toBroadcastFormat(): string {
    if (!this._transaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return this._transaction.combinedHash;
  }

  toJson(): WalletInitializationDataTxData {
    if (!this._transaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const result: WalletInitializationDataTxData = {
      id: this.id,
      type: this._type as TransactionType,
    };
    // Add logic to parse the preparedTransaction & extract sender, receiver
    return result;
  }
}
