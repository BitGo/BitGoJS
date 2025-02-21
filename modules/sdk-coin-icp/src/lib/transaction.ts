import { BaseKey, BaseTransaction, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { IcpTransaction, IcpTransactionData, PayloadsData } from './iface';
import { Utils } from './utils';
import { KeyPair } from './keyPair';

export class Transaction extends BaseTransaction {
  protected _icpTransactionData: IcpTransactionData;
  protected _icpTransaction: IcpTransaction;
  protected _payloadsData: PayloadsData;
  protected _signedTransaction: string;
  protected _utils: Utils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: Utils) {
    super(_coinConfig);
    this._utils = utils;
  }

  set icpTransaction(value: IcpTransaction) {
    this._icpTransaction = value;
  }

  set payloadsData(value: PayloadsData) {
    this._payloadsData = value;
  }

  set signedTransaction(value: string) {
    this._signedTransaction = value;
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
        expiryTime: parsedTx.expiryTime,
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
    try {
      const keyPair = new KeyPair({ prv: key.key });
      const publicKey = keyPair.getPublicKey({ compressed: true });
      if (this._icpTransactionData.senderPublicKeyHex !== Buffer.from(publicKey).toString('hex')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}
