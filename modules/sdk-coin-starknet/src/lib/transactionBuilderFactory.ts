import { BaseTransactionBuilderFactory, InvalidTransactionError, MethodNotImplementedError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { StarknetTransactionType } from './iface';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  async from(rawTransaction: string): Promise<TransactionBuilder> {
    const transaction = new Transaction(this._coinConfig);
    await transaction.fromRawTransaction(rawTransaction);
    try {
      switch (transaction.starknetTransactionData.transactionType) {
        case StarknetTransactionType.INVOKE:
          return this.getTransferBuilder(transaction);
        default:
          throw new InvalidTransactionError('Invalid transaction type');
      }
    } catch (e) {
      throw new InvalidTransactionError('Invalid transaction: ' + e.message);
    }
  }

  private static initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new MethodNotImplementedError();
  }
}
