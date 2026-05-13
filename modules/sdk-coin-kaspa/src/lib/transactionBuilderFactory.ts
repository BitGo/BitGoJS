import { BaseTransactionBuilderFactory, NotImplementedError } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(coinConfig: Readonly<StaticsBaseCoin>) {
    super(coinConfig);
  }

  /**
   * Get a base transaction builder for Kaspa transfers.
   */
  getBuilder(): TransactionBuilder {
    return new TransactionBuilder(this._coinConfig);
  }

  /** @inheritdoc */
  getTransferBuilder(): TransactionBuilder {
    return this.getBuilder();
  }

  /**
   * Kaspa does not have a wallet initialization transaction.
   * @throws NotImplementedError
   */
  getWalletInitializationBuilder(): never {
    throw new NotImplementedError('getWalletInitializationBuilder is not supported for Kaspa');
  }

  /** @inheritdoc */
  from(rawTransaction: string): TransactionBuilder {
    const builder = this.getBuilder();
    builder.from(rawTransaction);
    return builder;
  }
}
