import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder/transactionBuilder';
import { TransferBuilder } from './transactionBuilder/transferBuilder';
import utils from './utils';
import { Transaction } from './transaction/transaction';
import { SignedTransaction } from '@aptos-labs/ts-sdk';
import { TransferTransaction } from './transaction/transferTransaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { FungibleAssetTransaction } from './transaction/fungibleAssetTransaction';
import { FungibleAssetTransactionBuilder } from './transactionBuilder/fungibleAssetTransactionBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(signedRawTxn: string): TransactionBuilder {
    try {
      const signedTxn = this.parseTransaction(signedRawTxn);
      const txnType = this.getTransactionTypeFromSignedTxn(signedTxn);
      switch (txnType) {
        case TransactionType.Send:
          const transferTx = new TransferTransaction(this._coinConfig);
          transferTx.fromDeserializedSignedTransaction(signedTxn);
          return this.getTransferBuilder(transferTx);
        case TransactionType.SendToken:
          const fungibleTransferTokenTx = new FungibleAssetTransaction(this._coinConfig);
          fungibleTransferTokenTx.fromDeserializedSignedTransaction(signedTxn);
          return this.getFungibleAssetTransactionBuilder(fungibleTransferTokenTx);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      throw e;
    }
  }

  getTransactionTypeFromSignedTxn(signedTxn: SignedTransaction): TransactionType {
    const rawTxn = signedTxn.raw_txn;
    return utils.getTransactionTypeFromTransactionPayload(rawTxn.payload);
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getFungibleAssetTransactionBuilder(tx?: Transaction): FungibleAssetTransactionBuilder {
    return this.initializeBuilder(tx, new FungibleAssetTransactionBuilder(this._coinConfig));
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
