import { BaseKey, BaseTransaction, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { IcpTransaction, IcpTransactionData, PayloadsData } from './iface';
import { Utils } from './utils';

export class Transaction extends BaseTransaction {
  protected _icpTransactionData: IcpTransactionData;
  protected _icpTransaction: IcpTransaction;
  protected _payloadsData: PayloadsData;
  protected _utils: Utils;

  get icpTransaction(): IcpTransaction {
    return this._icpTransaction;
  }

  set icpTransaction(value: IcpTransaction) {
    this._icpTransaction = value;
  }

  get payloadsData(): PayloadsData {
    return this._payloadsData;
  }

  set payloadsData(value: PayloadsData) {
    this._payloadsData = value;
  }

  constructor(_coinConfig: Readonly<CoinConfig>, utils: Utils) {
    super(_coinConfig);
    this._utils = utils;
  }

  get icpTransactionData(): IcpTransactionData {
    return this._icpTransactionData;
  }

  set icpTransactionData(value: IcpTransactionData) {
    this._icpTransactionData = value;
  }

  get icpTransactionType(): TransactionType {
    return this._icpTransactionData.transactionType;
  }

  fromRawTransaction(rawTransaction: string): void {
    try {
      const parsedTx = JSON.parse(rawTransaction);
      this._icpTransactionData = {
        senderAddress: parsedTx.address,
        receiverAddress: parsedTx.externalOutputs[0].address,
        amount: parsedTx.inputAmount,
        fee: parsedTx.fee,
        senderPublicKeyHex: parsedTx.senderPublicKey,
        memo: parsedTx.seqno,
        transactionType: parsedTx.type,
        expireTime: parsedTx.expireTime,
      };
      this._utils.validateRawTransaction(this._icpTransactionData);
    } catch (error) {
      throw new Error('Invalid raw transaction format: ' + error.message);
    }
  }

  toJson(): void {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  toBroadcastFormat() {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }
}
