import { BaseTransactionBuilderFactory } from '@bitgo-beta/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  public getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }
  public getTransferBuilder(): TransferBuilder {
    throw new Error('Method not implemented.');
  }
  public from(raw: string | Uint8Array): TransactionBuilder {
    throw new Error('Method not implemented.');
  }
}
