import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TokenTransferBuilder } from './tokenTransferBuilder';
import utils from './utils';

/**
 * Builds a Polymesh settlement.addAndAffirmWithMediators transaction against
 * Polymesh v8 chain metadata. Identical behaviour to TokenTransferBuilder;
 * only the material differs.
 */
export class V8TokenTransferBuilder extends TokenTransferBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }
}
