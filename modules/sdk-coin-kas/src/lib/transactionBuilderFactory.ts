/**
 * Kaspa (KAS) Transaction Builder Factory
 */

import { BaseTransactionBuilderFactory, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(private _coin: Readonly<CoinConfig>) {
    super(_coin);
  }

  /**
   * Get a transaction builder for standard transfers.
   */
  getTransferBuilder(): TransactionBuilder {
    return new TransactionBuilder(this._coin);
  }

  /**
   * Initialize a builder from an existing serialized transaction.
   */
  from(rawTx: string): TransactionBuilder {
    const builder = this.getTransferBuilder();
    builder.from(rawTx);
    return builder;
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): TransactionBuilder {
    throw new InvalidTransactionError('Kaspa does not support wallet initialization transactions');
  }
}
