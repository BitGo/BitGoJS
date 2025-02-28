import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { BaseTransaction, BaseKey, SigningError, BuildTransactionError } from '@bitgo/sdk-core';
import { Utils } from './utils';
import { Transaction } from './transaction';
import { UnsignedTransactionBuilder } from './unsignedTransactionBuilder';
import {
  CurveType,
  IcpMetadata,
  IcpOperation,
  IcpPublicKey,
  IcpTransaction,
  IcpTransactionData,
  OperationType,
} from './iface';
import { SignedTransactionBuilder } from './signedTransactionBuilder';
import { KeyPair } from './keyPair';
import assert from 'assert';

export class TransferBuilder extends TransactionBuilder {
  protected _utils: Utils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: Utils) {
    super(_coinConfig);
    this._utils = utils;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.validateTransaction(this._transaction);
    this.buildIcpTransactionData();
    const unsignedTransactionBuilder = new UnsignedTransactionBuilder(this._transaction.icpTransaction);
    const payloadsData = await unsignedTransactionBuilder.getUnsignedTransaction();
    this._transaction.payloadsData = payloadsData;
    return this._transaction;
  }

  protected buildIcpTransactionData(): void {
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._publicKey, new BuildTransactionError('sender public key is required before building'));
    assert(this._amount, new BuildTransactionError('amount is required before building'));
    assert(this._receiverId, new BuildTransactionError('receiver is required before building'));
    assert(this._memo, new BuildTransactionError('memo is required before building'));
    const publicKey: IcpPublicKey = {
      hex_bytes: this._publicKey,
      curve_type: CurveType.SECP256K1,
    };

    const senderOperation: IcpOperation = {
      type: OperationType.TRANSACTION,
      account: { address: this._sender },
      amount: {
        value: `-${this._amount}`,
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };

    const receiverOperation: IcpOperation = {
      type: OperationType.TRANSACTION,
      account: { address: this._receiverId },
      amount: {
        value: this._amount,
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };

    const feeOperation: IcpOperation = {
      type: OperationType.FEE,
      account: { address: this._sender },
      amount: {
        value: this._utils.gasData(),
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };

    const currentTime = Date.now() * 1000_000;
    const ingressStartTime = currentTime;
    const ingressEndTime = ingressStartTime + 5 * 60 * 1000_000_000; // 5 mins in nanoseconds
    const metaData: IcpMetadata = {
      created_at_time: currentTime,
      memo: this._memo,
      ingress_start: ingressStartTime,
      ingress_end: ingressEndTime,
    };

    const icpTransaction: IcpTransaction = {
      public_keys: [publicKey],
      operations: [senderOperation, receiverOperation, feeOperation],
      metadata: metaData,
    };
    const icpTransactionData: IcpTransactionData = {
      senderAddress: this._sender,
      receiverAddress: this._receiverId,
      amount: this._amount,
      fee: this._utils.gasData(),
      senderPublicKeyHex: this._publicKey,
      memo: this._memo,
      transactionType: OperationType.TRANSACTION,
      expiryTime: ingressEndTime,
    };
    this._transaction.icpTransactionData = icpTransactionData;
    this._transaction.icpTransaction = icpTransaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): BaseTransaction {
    this.validateKey(key);
    if (!this.transaction.canSign(key)) {
      throw new SigningError('Private key cannot sign the transaction');
    }
    const keyPair = new KeyPair({ prv: key.key });
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new SigningError('invalid private key');
    }
    const signedTransactionBuilder = new SignedTransactionBuilder(
      this._transaction.unsignedTransaction,
      this._transaction.signaturePayload
    );
    this._transaction.signedTransaction = signedTransactionBuilder.getSignTransaction();
    return this._transaction;
  }
}
