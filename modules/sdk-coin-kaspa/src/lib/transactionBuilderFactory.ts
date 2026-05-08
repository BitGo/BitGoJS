import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';

export class TransactionBuilderFactory {
  protected _coinConfig: Readonly<StaticsBaseCoin>;

  constructor(coinConfig: Readonly<StaticsBaseCoin>) {
    this._coinConfig = coinConfig;
  }

  /**
   * Get a base transaction builder for Kaspa transfers.
   */
  getBuilder(): TransactionBuilder {
    return new TransactionBuilder(this._coinConfig);
  }

  /**
   * Reconstruct a transaction builder from a raw transaction hex.
   */
  from(rawTransaction: string): TransactionBuilder {
    const builder = this.getBuilder();
    builder.from(rawTransaction);
    return builder;
  }
}
