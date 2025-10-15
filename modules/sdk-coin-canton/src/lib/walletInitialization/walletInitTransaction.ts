import { BaseKey, BaseTransaction, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { PreparedParty, WalletInitTxData } from '../iface';
import { Buffer } from 'buffer';

export class WalletInitTransaction extends BaseTransaction {
  private _preparedParty: PreparedParty;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  get preparedParty(): PreparedParty {
    return this._preparedParty;
  }

  set preparedParty(transaction: PreparedParty) {
    this._preparedParty = transaction;
    this._id = transaction.multiHash;
    this._type = TransactionType.WalletInitialization;
  }

  canSign(key: BaseKey): boolean {
    return false;
  }

  set signatures(signature: string) {
    this._signatures.push(signature);
  }

  toBroadcastFormat(): string {
    if (!this._preparedParty) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return Buffer.from(JSON.stringify(this._preparedParty)).toString('base64');
  }

  toJson(): WalletInitTxData {
    if (!this._preparedParty) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const result: WalletInitTxData = {
      id: this.id,
      type: this._type as TransactionType,
      preparedParty: this._preparedParty,
    };
    return result;
  }

  get signablePayload(): Buffer {
    if (!this._preparedParty) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return Buffer.from(this._preparedParty.multiHash);
  }

  fromRawTransaction(rawTx: string): void {
    try {
      const decoded: PreparedParty = JSON.parse(Buffer.from(rawTx, 'base64').toString('utf8'));
      this._preparedParty = decoded;
      this._type = TransactionType.WalletInitialization;
      this._id = decoded.multiHash;
    } catch (e) {
      throw new InvalidTransactionError('Unable to parse raw transaction data');
    }
  }
}
