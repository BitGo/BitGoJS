import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { PreApproveAssetBuilder } from './preApproveAssetBuilder';
import utils from './utils';

/**
 * Builds a Polymesh asset.preApproveAsset transaction against Polymesh v8
 * chain metadata. Identical behaviour to PreApproveAssetBuilder; only the
 * material differs.
 */
export class V8PreApproveAssetBuilder extends PreApproveAssetBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }
}
