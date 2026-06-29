import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransferBuilder } from './transferBuilder';
import utils from './utils';

/**
 * Builds a POLYX balances.transferWithMemo transaction against Polymesh v8
 * chain metadata. Identical behaviour to TransferBuilder; only the material
 * (specVersion / txVersion) differs.
 */
export class V8TransferBuilder extends TransferBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }
}
