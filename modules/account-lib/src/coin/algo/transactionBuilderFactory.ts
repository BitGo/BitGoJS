import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  public getWalletInitializationBuilder(): void {
    throw new NotImplementedError('Method not implemented.');
  }
  public getTransferBuilder(): void {
    throw new NotImplementedError('Method not implemented.');
  }
  public from(raw: string | Uint8Array): void {
    throw new NotImplementedError('Method not implemented.');
  }
}
