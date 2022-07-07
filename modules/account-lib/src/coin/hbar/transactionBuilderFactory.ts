import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseTransactionBuilderFactory,
  InvalidTransactionError,
  ParseTransactionError,
  TransactionType,
} from '@bitgo/sdk-core';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { CoinTransferBuilder } from './coinTransferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isTokenTransfer, isValidRawTransactionFormat } from './utils';
import { TokenAssociateBuilder } from './tokenAssociateBuilder';
import { TokenTransferBuilder } from './tokenTransferBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return this.initializeBuilder(tx, new WalletInitializationBuilder(this._coinConfig));
  }

  /** @inheritDoc */
  getTransferBuilder(tx?: Transaction): CoinTransferBuilder {
    return this.initializeBuilder(tx, new CoinTransferBuilder(this._coinConfig));
  }

  /**
   * Returns a specific builder to create a funds token transfer transaction
   */
  getTokenTransferBuilder(tx?: Transaction): TokenTransferBuilder {
    return this.initializeBuilder(tx, new TokenTransferBuilder(this._coinConfig));
  }

  /**
   * Returns a builder to create a token association transaction
   */
  getTokenAssociateBuilder(tx?: Transaction): TokenAssociateBuilder {
    return this.initializeBuilder(tx, new TokenAssociateBuilder(this._coinConfig));
  }

  /** @inheritDoc */
  from(raw: Uint8Array | string): TransactionBuilder {
    this.validateRawTransaction(raw);
    const tx = this.parseRawTransaction(raw);
    switch (tx.type) {
      case TransactionType.Send:
        return isTokenTransfer(tx.txBody.cryptoTransfer!)
          ? this.getTokenTransferBuilder(tx)
          : this.getTransferBuilder(tx);
      case TransactionType.WalletInitialization:
        return this.getWalletInitializationBuilder(tx);
      case TransactionType.AssociatedTokenAccountInitialization:
        return this.getTokenAssociateBuilder(tx);
      default:
        throw new InvalidTransactionError('Invalid transaction ' + tx.txBody.data);
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

  /**
   * Returns a transaction instance from the encoded value
   *
   * @param {Uint8Array | string} rawTransaction - encoded transaction
   * @returns {Transaction} the parsed transaction instance
   */
  private parseRawTransaction(rawTransaction: Uint8Array | string): Transaction {
    const tx = new Transaction(this._coinConfig);
    tx.fromRawTransaction(rawTransaction);
    return tx;
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {any} rawTransaction - Transaction in any format
   */
  private validateRawTransaction(rawTransaction: Uint8Array | string) {
    if (!isValidRawTransactionFormat(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }
}
