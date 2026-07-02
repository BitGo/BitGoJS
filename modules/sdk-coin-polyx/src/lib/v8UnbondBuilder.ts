import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { UnbondBuilder } from './unbondBuilder';
import utils from './utils';

/**
 * Builds a staking.unbond transaction against Polymesh v8 chain metadata. unbond is unchanged
 * between v7 and v8 (`unbond(value)`); only the material (specVersion / txVersion) differs from
 * {@link UnbondBuilder}.
 */
export class V8UnbondBuilder extends UnbondBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }
}
