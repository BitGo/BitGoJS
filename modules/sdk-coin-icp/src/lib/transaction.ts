import { BaseKey, BaseTransaction, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { IcpTransactionData, IcpTransaction, IcpMetadata } from './iface';
import { Utils } from './utils';

export class Transaction extends BaseTransaction {
  protected IcpTransaction: IcpTransaction;
  protected IcpTransactionData: IcpTransactionData;
  protected utils: Utils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: Utils) {
    super(_coinConfig);
    this.utils = utils;
  }

  get icpTransaction(): IcpTransaction {
    return this.IcpTransaction;
  }

  get icpTransactionType(): TransactionType {
    return this.IcpTransactionData.transactionType;
  }

  setIcpTransaction(tx: IcpTransaction): void {
    this.IcpTransaction = tx;
  }

  /** @inheritdoc */
  toJson(): IcpTransaction {
    if (!this.IcpTransactionData) {
      throw new Error('Transaction data is not set.');
    }

    this.IcpTransaction = {
      network_identifier: this.utils.getNetworkIdentifier(),
      public_keys: [
        {
          hex_bytes: this.IcpTransactionData.senderPublicKeyHex,
          curve_type: this.utils.getCurveType(),
        },
      ],
      operations: [
        {
          operation_identifier: { index: 0 },
          type: this.utils.getTransactionType(),
          account: { address: this.IcpTransactionData.senderAddress },
          amount: {
            value: `-${this.IcpTransactionData.amount}`, // Negative for sender
            currency: { symbol: this.IcpTransactionData.coin, decimals: this.utils.getDecimalPrecision() },
          },
        },
        {
          operation_identifier: { index: 1 },
          type: this.utils.getTransactionType(),
          account: { address: this.IcpTransactionData.receiverAddress },
          amount: {
            value: this.IcpTransactionData.amount, // Positive for receiver
            currency: { symbol: this.IcpTransactionData.coin, decimals: this.utils.getDecimalPrecision() },
          },
        },
        {
          operation_identifier: { index: 2 },
          type: this.utils.getFeeType(),
          account: { address: this.IcpTransactionData.senderAddress },
          amount: {
            value: `-${this.IcpTransactionData.fee}`, // FEE is negative
            currency: { symbol: this.IcpTransactionData.coin, decimals: this.utils.getDecimalPrecision() },
          },
        },
      ],
      metadata: this.getMetaData(),
    };

    return this.IcpTransaction;
  }

  getMetaData(): IcpMetadata {
    const currentTime = Date.now() * 1_000_000;
    if (this.IcpTransactionData.expireTime >= currentTime) {
      throw new Error('Invalid expire time');
    }
    return {
      created_at_time: currentTime,
      memo: this.IcpTransactionData.sequenceNumber,
      ingress_start: currentTime,
      ingress_end: this.IcpTransactionData.expireTime,
    };
  }

  /** @inheritdoc */
  toBroadcastFormat() {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  fromRawTransaction(rawTransaction: string): void {
    try {
      const parsedTx = JSON.parse(rawTransaction);
      const transactionData = {
        senderAddress: parsedTx.address,
        receiverAddress: parsedTx.externalOutputs[0].address,
        amount: parsedTx.inputAmount,
        fee: parsedTx.fee, //TODO make an IMS call to get the fee OR get it hard coded
        senderPublicKeyHex: parsedTx.senderPublicKey,
        sequenceNumber: parsedTx.seqno,
        transactionType: parsedTx.type,
        expireTime: parsedTx.expireTime,
        id: parsedTx.id,
        coin: parsedTx.coin,
      };
      this.IcpTransactionData = transactionData;
      this.utils.validateRawTransaction(transactionData);
    } catch (error) {
      throw new Error('Invalid raw transaction format: ' + error.message);
    }
  }
}
