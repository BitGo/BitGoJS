import { BaseTransactionBuilderFactory } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';

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
  getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }
}
