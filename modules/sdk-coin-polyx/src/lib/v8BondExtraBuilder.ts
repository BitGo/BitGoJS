import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BondExtraBuilder } from './bondExtraBuilder';
import utils from './utils';

/**
 * Builds a staking.bondExtra transaction against Polymesh v8 chain metadata. bondExtra is
 * unchanged between v7 and v8 (`bondExtra(maxAdditional)`); only the material (specVersion /
 * txVersion) differs from {@link BondExtraBuilder}.
 */
export class V8BondExtraBuilder extends BondExtraBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }
}
