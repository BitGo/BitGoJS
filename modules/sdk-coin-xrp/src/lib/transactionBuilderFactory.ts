import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import xrpl from 'xrpl';
import { AccountSetBuilder } from './accountSetBuilder';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import utils from './utils';
import { WalletInitializationBuilder } from './walletInitializationBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    let txHex = raw;
    if (!utils.isValidHex(raw)) {
      try {
        txHex = xrpl.encode(JSON.parse(raw));
      } catch (e) {
        throw new InvalidTransactionError('Invalid transaction');
      }
    }
    const tx = this.parseTransaction(txHex);
    try {
      switch (tx.type) {
        case TransactionType.AccountUpdate:
          return this.getAccountUpdateBuilder(tx);
        case TransactionType.Send:
          return this.getTransferBuilder(tx);
        case TransactionType.WalletInitialization:
          return this.getWalletInitializationBuilder(tx);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      throw e;
    }
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return this.initializeBuilder(tx, new WalletInitializationBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  public getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  public getAccountUpdateBuilder(tx?: Transaction): AccountSetBuilder {
    return this.initializeBuilder(tx, new AccountSetBuilder(this._coinConfig));
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
  private parseTransaction(rawTransaction: string): Transaction {
    const tx = new Transaction(this._coinConfig);
    tx.fromRawTransaction(rawTransaction);
    return tx;
  }
}
