import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { OsmoTransactionBuilder } from './transactionBuilder';
import { OsmoTransferBuilder } from './transferBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { OsmoTransaction } from './transaction';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): OsmoTransactionBuilder {
    const tx = new OsmoTransaction(this._coinConfig);
    tx.enrichTransactionDetailsFromRawTransaction(raw);
    try {
      switch (tx.type) {
        case TransactionType.Send:
          return this.getTransferBuilder(tx);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      throw new InvalidTransactionError('Invalid transaction: ' + e.message);
    }
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: OsmoTransaction): OsmoTransferBuilder {
    return this.initializeBuilder(tx, new OsmoTransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Initialize the builder with the given transaction
   *
   * @param {OsmoTransaction | undefined} tx - the transaction used to initialize the builder
   * @param {OsmoTransactionBuilder} builder - the builder to be initialized
   * @returns {OsmoTransactionBuilder} the builder initialized
   */
  private initializeBuilder<T extends OsmoTransactionBuilder>(tx: OsmoTransaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }
}
