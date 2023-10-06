import { BaseTransactionBuilderFactory } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    const builder = new TransferBuilder(this._coinConfig);
    builder.from(raw);
    return builder;
  }

  /** @inheritdoc */
  getTransferBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }
}
