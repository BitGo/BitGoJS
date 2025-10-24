import {
  BaseTransaction,
  BaseTransactionBuilderFactory,
  InvalidTransactionError,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransferAcceptanceBuilder } from './transferAcceptanceBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { Transaction } from './transaction/transaction';
import { WalletInitBuilder } from './walletInitBuilder';
import { WalletInitTransaction } from './walletInitialization/walletInitTransaction';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
  /** @inheritdoc */
  from(raw: string): TransactionBuilder | WalletInitBuilder {
    try {
      const tx = new WalletInitTransaction(this._coinConfig);
      tx.fromRawTransaction(raw);
      return this.getWalletInitializationBuilder(tx);
    } catch {
      const tx = new Transaction(this._coinConfig);
      tx.fromRawTransaction(raw);
      switch (tx.type) {
        case TransactionType.Send: {
          return this.getTransferBuilder(tx);
        }
        case TransactionType.TransferAccept: {
          return this.getTransferAcceptanceBuilder(tx);
        }
        default: {
          throw new InvalidTransactionError('unsupported transaction');
        }
      }
    }
  }

  /** @inheritdoc */
  getTransferAcceptanceBuilder(tx?: Transaction): TransferAcceptanceBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferAcceptanceBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
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
