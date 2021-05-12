import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { NotImplementedError } from '../baseCoin/errors';
import { KeyRegistrationBuilder } from './keyRegistrationBuilder';
import { TransferBuilder } from './transferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { AssetTransferBuilder } from './assetTransferBuilder';

export class TransactionBuilderFactory {
  private readonly coinConfig: Readonly<CoinConfig>;

  constructor(coinConfig: Readonly<CoinConfig>) {
    this.coinConfig = coinConfig;
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
}
