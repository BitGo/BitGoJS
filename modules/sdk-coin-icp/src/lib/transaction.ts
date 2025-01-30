import { BaseKey, BaseTransaction } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { IcpTransactionData, IcpTransaction, IcpMetadata } from './iface';
import { Utils } from './utils';

export class Transaction extends BaseTransaction {
  protected IcpTransaction: IcpTransaction;
  protected IcpTransactionData: IcpTransactionData;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get icpTransaction(): IcpTransaction {
    return this.IcpTransaction;
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
      network_identifier: Utils.getNetworkIdentifier(),
      public_keys: [
        {
          hex_bytes: this.IcpTransactionData.senderPublicKeyHex,
          curve_type: Utils.getCurveType(),
        },
      ],
      operations: [
        {
          operation_identifier: { index: 0 },
          type: Utils.getTransactionType(),
          account: { address: this.IcpTransactionData.senderAddress },
          amount: {
            value: `-${this.IcpTransactionData.amount}`, // Negative for sender
            currency: { symbol: this.IcpTransactionData.coin, decimals: Utils.getDecimalPrecision() },
          },
        },
        {
          operation_identifier: { index: 1 },
          type: Utils.getTransactionType(),
          account: { address: this.IcpTransactionData.receiverAddress },
          amount: {
            value: this.IcpTransactionData.amount, // Positive for receiver
            currency: { symbol: this.IcpTransactionData.coin, decimals: Utils.getDecimalPrecision() },
          },
        },
        {
          operation_identifier: { index: 2 },
          type: Utils.getFeeType(),
          account: { address: this.IcpTransactionData.senderAddress },
          amount: {
            value: `-${this.IcpTransactionData.fee}`, // FEE is negative
            currency: { symbol: this.IcpTransactionData.coin, decimals: Utils.getDecimalPrecision() },
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

  static parseRawTransaction(rawTransaction: string): IcpTransactionData {
    try {
      const parsedTx = JSON.parse(rawTransaction);
      return {
        senderAddress: parsedTx.address,
        receiverAddress: parsedTx.externalOutputs[0].address,
        amount: parsedTx.inputAmount,
        fee: parsedTx.fee, //TODO: check if this is correct
        senderPublicKeyHex: parsedTx.senderPublicKey,
        sequenceNumber: parsedTx.seqno,
        transactionType: parsedTx.type,
        expireTime: parsedTx.expireTime,
        id: parsedTx.id,
        coin: parsedTx.coin,
      };
    } catch (error) {
      throw new Error('Invalid raw transaction format: ' + error.message);
    }
  }
}
