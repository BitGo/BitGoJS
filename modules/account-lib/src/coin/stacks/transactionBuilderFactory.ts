import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import {
  ParseTransactionError,
  InvalidTransactionError,
} from '../baseCoin/errors';
import { TransferBuilder } from './transferBuilder';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import {
  BufferReader,
  deserializeTransaction,
  PayloadType,
} from '@stacks/transactions';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    this.validateRawTransaction(raw);
    try {
      const tx = this.parseTransaction(raw);
      switch (tx.stxTransaction.payload.payloadType) {
        case PayloadType.TokenTransfer:
          return this.getTransferBuilder(tx);
        // TODO: add case of wallet
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      console.error(e);
      throw new ParseTransactionError('There was an error parsing the raw transaction');
    }
  }

  private parseTransaction(rawTransaction: string): Transaction {
    const tx = new Transaction(this._coinConfig);
    const stackstransaction = deserializeTransaction(
      BufferReader.fromBuffer(Buffer.from(rawTransaction.substring(2), 'hex')),
    );
    tx.stxTransaction = stackstransaction;
    return tx;
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new WalletInitializationBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
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
  validateRawTransaction(rawTransaction: any): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
  }
}
