import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { EosTransactionBuilder } from './eosTransactionBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  public getTransferBuilder(): EosTransactionBuilder {
    throw new Error('Method not implemented.');
  }
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: Uint8Array | string): TransactionBuilder {
    throw new NotImplementedError('from not implemented');
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new WalletInitializationBuilder(this._coinConfig));
  }

  /**
   * Initialize the builder with the given transaction
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @param {TransactionBuilder} builder - the builder to be initialized
   * @returns {TransactionBuilder} the builder initialized
   */
  private static initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T): T {
    // if (tx) {
    //   builder.initBuilder(tx);
    // }
    return builder;
  }
}
