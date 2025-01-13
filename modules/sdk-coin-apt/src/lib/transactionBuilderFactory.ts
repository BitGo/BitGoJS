import { BaseTransactionBuilderFactory } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import utils from './utils';
import { Transaction } from './transaction/transaction';
import { SignedTransaction } from '@aptos-labs/ts-sdk';
import { TransferTransaction } from './transaction/transferTransaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(signedRawTxn: string): TransactionBuilder {
    utils.validateRawTransaction(signedRawTxn);
    try {
      const signedTxn = this.parseTransaction(signedRawTxn);
      // Assumption: only a single transaction type exists
      // TODO: add txn type switch case
      const transferTx = new TransferTransaction(this._coinConfig);
      transferTx.fromDeserializedSignedTransaction(signedTxn);
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

  /** Parse the transaction from a signed txn hex string
   *
   * @param {string} signedRawTransaction - the signed txn hex
   * @returns {SignedTransaction} parsedtransaction
   */
  private parseTransaction(signedRawTransaction: string): SignedTransaction {
    return Transaction.deserializeSignedTransaction(signedRawTransaction);
  }
}
