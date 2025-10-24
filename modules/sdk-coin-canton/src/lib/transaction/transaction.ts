import { BaseKey, BaseTransaction, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CantonPrepareCommandResponse, PreparedTxnParsedInfo, TxData } from '../iface';
import utils from '../utils';

export class Transaction extends BaseTransaction {
  private _prepareCommand: CantonPrepareCommandResponse;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  get prepareCommand(): CantonPrepareCommandResponse {
    return this._prepareCommand;
  }

  set prepareCommand(transaction: CantonPrepareCommandResponse) {
    this._prepareCommand = transaction;
  }

  set transactionType(transactionType: TransactionType) {
    this._type = transactionType;
  }

  get id(): string {
    if (!this._id) {
      throw new InvalidTransactionError('transaction is is not set');
    }
    return this._id;
  }

  set id(id: string) {
    this._id = id;
  }

  canSign(key: BaseKey): boolean {
    return false;
  }

  toBroadcastFormat(): string {
    if (!this._prepareCommand) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return Buffer.from(JSON.stringify(this._prepareCommand)).toString('base64');
  }

  toJson(): TxData {
    if (!this._prepareCommand || !this._prepareCommand.preparedTransaction) {
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
      parsedInfo = utils.parseRawCantonTransactionData(this._prepareCommand.preparedTransaction);
    } catch (e) {
      throw new InvalidTransactionError(`Failed to parse transaction hash: ${e instanceof Error ? e.message : e}`);
    }
    result.sender = parsedInfo.sender;
    result.receiver = parsedInfo.receiver;
    return result;
  }

  get signablePayload(): Buffer {
    if (!this._prepareCommand) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return Buffer.from(this._prepareCommand.preparedTransactionHash, 'base64');
  }

  fromRawTransaction(rawTx: string): void {
    try {
      const decoded: CantonPrepareCommandResponse = JSON.parse(Buffer.from(rawTx, 'base64').toString('utf8'));
      this.prepareCommand = decoded;
    } catch (e) {
      throw new InvalidTransactionError('Unable to parse raw transaction data');
    }
  }
}
