import { BaseKey, BaseTransaction, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CantonPrepareCommandResponse, PreparedTxnParsedInfo, TxData } from './iface';
import utils from './utils';

export class Transaction extends BaseTransaction {
  private _transaction: CantonPrepareCommandResponse;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  get transaction(): CantonPrepareCommandResponse {
    return this._transaction;
  }

  set transaction(transaction: CantonPrepareCommandResponse) {
    this._transaction = transaction;
    this._id = transaction.preparedTransactionHash;
  }

  canSign(key: BaseKey): boolean {
    return false;
  }

  toBroadcastFormat(): string {
    if (!this._transaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return this._transaction.preparedTransactionHash;
  }

  toJson(): TxData {
    if (!this._transaction || !this._transaction.preparedTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const result: TxData = {
      id: this.id,
      type: this._type as TransactionType,
      sender: '',
      receiver: '',
    };
    // TODO: extract other required data (utxo used, request time, execute before etc)
    let parsedInfo: PreparedTxnParsedInfo;
    try {
      parsedInfo = utils.parseRawCantonTransactionData(this._transaction.preparedTransaction);
    } catch (e) {
      throw new InvalidTransactionError(`Failed to parse transaction hash: ${e instanceof Error ? e.message : e}`);
    }
    result.sender = parsedInfo.sender;
    result.receiver = parsedInfo.receiver;
    return result;
  }
}
