import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { BaseTransaction, BuildTransactionError, BaseKey } from '@bitgo/sdk-core';
import { Utils } from './utils';
import { Transaction } from './transaction';
import { UnsignedTransactionBuilder } from './unsignedTransactionBuilder';
import {
  CurveType,
  IcpTransactionBuildMetadata,
  IcpOperation,
  IcpPublicKey,
  IcpTransaction,
  IcpTransactionData,
  OperationType,
} from './iface';
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

    const createdTimestamp = this._transaction.createdTimestamp;
    const { metaData, ingressEndTime }: { metaData: IcpTransactionBuildMetadata; ingressEndTime: number | BigInt } =
      this._utils.getMetaData(this._memo, createdTimestamp);

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
    const signatures = this._utils.getSignatures(this._transaction.payloadsData, this._publicKey, key.key);
    this._transaction.addSignature(signatures);
    return this._transaction;
  }
}
