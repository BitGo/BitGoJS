import { Transaction as VetTransaction } from '@vechain/sdk-core';
import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder/transactionBuilder';
import { TransferBuilder } from './transactionBuilder/transferBuilder';
import { Transaction } from './transaction/transaction';
import utils from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(signedRawTx: string): TransactionBuilder {
    try {
      const signedTx = Transaction.deserializeTransaction(signedRawTx);
      const type = this.getTransactionTypeFromSignedTxn(signedTx);
      switch (type) {
        case TransactionType.Send:
          const transferTx = new Transaction(this._coinConfig);
          transferTx.fromDeserializedSignedTransaction(signedTx);
          return this.getTransferBuilder(transferTx);
        default:
          throw new InvalidTransactionError('Invalid transaction type');
      }
    } catch (e) {
      throw e;
    }
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }

  getTransactionTypeFromSignedTxn(signedTxn: VetTransaction): TransactionType {
    return utils.getTransactionTypeFromClause(signedTxn.body.clauses);
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
}
