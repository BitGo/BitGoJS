import { BaseTransaction, BaseTransactionBuilderFactory } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { WalletInitBuilder } from './walletInitBuilder';
import { WalletInitTransaction } from './walletInitialization/walletInitTransaction';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  getTransferBuilder(): TransferBuilder {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: WalletInitTransaction): WalletInitBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new WalletInitBuilder(this._coinConfig));
  }

  private static initializeBuilder<TTx extends BaseTransaction, TBuilder extends { initBuilder(tx: TTx): void }>(
    tx: TTx | undefined,
    builder: TBuilder
  ): TBuilder {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }
}
