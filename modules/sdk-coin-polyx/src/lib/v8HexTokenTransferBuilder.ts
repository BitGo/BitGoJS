import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { HexTokenTransferBuilder } from './hexTokenTransferBuilder';
import utils from './utils';

/**
 * Builds a Polymesh settlement.addAndAffirmWithMediators transaction using
 * the hex (NEW) memo encoding against Polymesh v8 chain metadata. Identical
 * behaviour to HexTokenTransferBuilder; only the material differs.
 */
export class V8HexTokenTransferBuilder extends HexTokenTransferBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }
}
