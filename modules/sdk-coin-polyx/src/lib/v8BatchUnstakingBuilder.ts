import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BatchUnstakingBuilder } from './batchUnstakingBuilder';
import utils from './utils';

/**
 * Builds a `utility.batchAll([chill, unbond])` unstaking transaction against Polymesh v8 chain
 * metadata. chill/unbond are unchanged between v7 and v8; only the material (specVersion /
 * txVersion) differs from {@link BatchUnstakingBuilder}.
 */
export class V8BatchUnstakingBuilder extends BatchUnstakingBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }
}
