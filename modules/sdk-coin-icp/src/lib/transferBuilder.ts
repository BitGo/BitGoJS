import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { BaseTransaction, BuildTransactionError, BaseKey } from '@bitgo/sdk-core';
import utils from './utils';
import { Transaction } from './transaction';
import { UnsignedTransactionBuilder } from './unsignedTransactionBuilder';
import {
  CurveType,
  IcpOperation,
  IcpPublicKey,
  IcpTransaction,
  IcpTransactionData,
  OperationType,
  DEFAULT_MEMO,
} from './iface';
import assert from 'assert';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
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
    // The ICP chain sets a memo field with a default value of 0. This ensures compatibility
    // by setting the memo to 0 if it's not explicitly provided.
    if (!this._memo || this._memo === undefined || this._memo === null) {
      this._memo = DEFAULT_MEMO;
    }
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
        value: utils.feeData(),
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };

    const createdTimestamp = this._transaction.createdTimestamp;
    const { metaData, ingressEndTime } = utils.getMetaData(this._memo, createdTimestamp, this._ingressEnd);

    const icpTransaction: IcpTransaction = {
      public_keys: [publicKey],
      operations: [senderOperation, receiverOperation, feeOperation],
      metadata: metaData,
    };
    const icpTransactionData: IcpTransactionData = {
      senderAddress: this._sender,
      receiverAddress: this._receiverId,
      amount: this._amount,
      fee: utils.feeData(),
      senderPublicKeyHex: this._publicKey,
      transactionType: OperationType.TRANSACTION,
      expiryTime: ingressEndTime,
      memo: this._memo,
    };

    this._transaction.icpTransactionData = icpTransactionData;
    this._transaction.icpTransaction = icpTransaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): BaseTransaction {
    const signatures = utils.getSignatures(this._transaction.payloadsData, this._publicKey, key.key);
    this._transaction.addSignature(signatures);
    return this._transaction;
  }
}
