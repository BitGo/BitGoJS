import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransferBuilder as SubstrateTransferBuilder } from '@bitgo/abstract-substrate';
import utils from './utils';

export class TransferBuilder extends SubstrateTransferBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getMaterial(_coinConfig.network.type));
  }
}
