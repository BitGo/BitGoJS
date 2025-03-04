import { BaseTransactionBuilderFactory, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { Utils } from './utils';
import { OperationType, ParsedTransaction } from './iface';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(rawTransaction: string): TransactionBuilder {
    const transaction = new Transaction(this._coinConfig, new Utils());
    transaction.fromRawTransaction(rawTransaction);
    try {
      switch (transaction.icpTransactionData.transactionType) {
        case OperationType.TRANSACTION:
          return this.getTransferBuilder(transaction);
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
  private static initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferBuilder(this._coinConfig, new Utils()));
  }

  parseTransaction(rawTransaction: string): Promise<ParsedTransaction> {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Transaction is empty');
    }
    const transaction = new Transaction(this._coinConfig, new Utils());
    return transaction.parseUnsignedTransaction(rawTransaction);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('method not implemented');
  }
}
