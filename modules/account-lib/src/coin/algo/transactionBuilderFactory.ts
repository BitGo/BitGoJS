import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { NotImplementedError } from '../baseCoin/errors';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { KeyRegistrationBuilder } from './keyRegistrationBuilder';
import { TransferBuilder } from './transferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { AssetTransferBuilder } from './assetTransferBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  getKeyRegistrationBuilder(): KeyRegistrationBuilder {
    throw new NotImplementedError('getKeyRegistrationBuilder not implemented');
  }

  getTransferBuilder(): TransferBuilder {
    throw new NotImplementedError('getTransferBuilder not implemented');
  }

  getAssetTransferBuilder(): AssetTransferBuilder {
    throw new NotImplementedError('getAssetTransferBuilder not implemented');
  }

  from(raw: string | Uint8Array): TransactionBuilder {
    throw new NotImplementedError('from not implemented');
  }

  public getWalletInitializationBuilder() {
    throw new Error('Method not implemented.');
  }
}
