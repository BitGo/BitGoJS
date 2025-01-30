import { BaseTransactionBuilderFactory, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TransferTransaction } from './transferTransaction';
import { IcpTransactionData, IcpTransactionType } from './iface';
import { TransferBuilder } from './transferBuilder';
import utils from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(rawTransaction: string): TransactionBuilder {
    utils.validateRawTransaction(rawTransaction);
    const transaction = this.parseTransaction(rawTransaction);
    try {
      switch (transaction.transactionType) {
        case IcpTransactionType.Transfer:
          const transferTx = new TransferTransaction(this._coinConfig);
          transferTx.fromRawTransaction(rawTransaction);
          return this.getTransferBuilder(transferTx);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      throw new InvalidTransactionError('Invalid transaction: ' + e.message);
    }
  }

  /**
   * Initialize the builder with the given transaction
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @param {TransactionBuilder} builder - the builder to be initialized
   * @returns {TransactionBuilder} the builder initialized
   */
  private initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('method not implemented');
  }

  /**
   * Parse the transaction from a raw transaction
   */
  private parseTransaction(rawTransaction: string): IcpTransactionData {
    return Transaction.parseRawTransaction(rawTransaction);
  }
}
