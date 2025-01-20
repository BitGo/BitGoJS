import { BaseTransactionBuilderFactory } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  getTransferBuilder(): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  getStakingBuilder(): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  getUnstakingBuilder(): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  getCustomTransactionBuilder(): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  getTokenTransferBuilder(): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('method not implemented');
  }

  /**
   * Parse the transaction from a raw transaction
   */
  private parseTransaction(rawTransaction: string): void {
    throw new Error('method not implemented');
  }
}
