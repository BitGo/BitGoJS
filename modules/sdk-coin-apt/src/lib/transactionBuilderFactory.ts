import { BaseTransactionBuilderFactory } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import utils from './utils';
import { Transaction } from './transaction/transaction';
import { RawTransaction } from '@aptos-labs/ts-sdk';
import { TransferTransaction } from './transaction/transferTransaction';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    // let builder: TransactionBuilder;
    utils.validateRawTransaction(raw);
    // const rawTxn = this.parseTransaction(raw);
    try {
      // Assumption: only a single transaction type exists
      // TODO: add txn type switch case
      const transferTx = new TransferTransaction(this._coinConfig);
      transferTx.fromRawTransaction(raw);
      return this.getTransferBuilder(transferTx);
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

  /** Parse the transaction from a raw transaction
   *
   * @param {string} rawTransaction - the raw tx
   * @returns {Transaction} parsedtransaction
   */
  private parseTransaction(rawTransaction: string): RawTransaction {
    return Transaction.deserializeRawTransaction(rawTransaction);
  }
}
