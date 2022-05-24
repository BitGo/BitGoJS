import { BaseTransactionBuilderFactory } from '@bitgo/sdk-core';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  public getWalletInitializationBuilder() {
    throw new Error('Method not implemented.');
  }
  public getTransferBuilder() {
    throw new Error('Method not implemented.');
  }
  public from(raw: string | Uint8Array) {
    throw new Error('Method not implemented.');
  }
}
