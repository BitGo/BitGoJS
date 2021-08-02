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

  getAssetTransferBuilder(): AssetTransferBuilder {
    return new AssetTransferBuilder(this._coinConfig);
  }

  getKeyRegistrationBuilder(): KeyRegistrationBuilder {
    return new KeyRegistrationBuilder(this._coinConfig);
  }

  from(rawTxn: string | Uint8Array): TransactionBuilder {
    const builder = this.getBuilder(rawTxn);
    builder.from(rawTxn);

    return builder;
  }
  public from(raw: string | Uint8Array): void {
    throw new NotImplementedError('Method not implemented.');
  }
}
