import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { InvalidTransactionError, ParseTransactionError } from '../baseCoin/errors';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { TransferBuilder } from './transferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidRawTransactionFormat, toUint8Array } from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return this.initializeBuilder(tx, new WalletInitializationBuilder(this._coinConfig));
  }

  /** @inheritDoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritDoc */
  from(raw: Uint8Array | string): TransactionBuilder {
    this.validateRawTransaction(raw);
    const tx = this.parseTransaction(raw);
    switch (tx.txBody.data) {
      case 'cryptoTransfer':
        return this.getTransferBuilder(tx);
      case 'cryptoCreateAccount':
        return this.getWalletInitializationBuilder(tx);
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
  private parseTransaction(rawTransaction: Uint8Array | string): Transaction {
    const tx = new Transaction(this._coinConfig);
    let buffer;
    if (typeof rawTransaction === 'string') {
      buffer = toUint8Array(rawTransaction);
    } else {
      buffer = rawTransaction;
    }
    tx.bodyBytes(buffer);
    return tx;
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {any} rawTransaction - Transaction in any format
   */
  private validateRawTransaction(rawTransaction: any) {
    if (!isValidRawTransactionFormat(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }
}
