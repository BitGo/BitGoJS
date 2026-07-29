import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { NominateBuilder } from './nominateBuilder';
import utils from './utils';

/**
 * Builds a staking.nominate transaction against Polymesh v8 chain metadata. nominate is unchanged
 * between v7 and v8 (`nominate(targets)`); only the material (specVersion / txVersion) differs from
 * {@link NominateBuilder}.
 */
export class V8NominateBuilder extends NominateBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }
}
