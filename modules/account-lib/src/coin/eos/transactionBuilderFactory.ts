import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { EosTransactionBuilder } from './eosTransactionBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  public getTransferBuilder(): EosTransactionBuilder {
<<<<<<< HEAD
    return new EosTransactionBuilder(this._coinConfig);
=======
    throw new Error('Method not implemented.');
>>>>>>> 9192d0d1 (feat(account-lib): buy ram bytes builder)
  }
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: Uint8Array | string): TransactionBuilder {
<<<<<<< HEAD
    const builder = new EosTransactionBuilder(this._coinConfig);
    builder.from(raw);
    return builder;
=======
    throw new NotImplementedError('from not implemented');
>>>>>>> 9192d0d1 (feat(account-lib): buy ram bytes builder)
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): void {
    throw new NotImplementedError('wallet not implemented');
<<<<<<< HEAD
=======
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
>>>>>>> 9192d0d1 (feat(account-lib): buy ram bytes builder)
  }
}
