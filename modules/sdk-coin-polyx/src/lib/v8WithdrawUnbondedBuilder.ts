import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { WithdrawUnbondedBuilder } from './withdrawUnbondedBuilder';
import utils from './utils';

/**
 * Builds a staking.withdrawUnbonded transaction against Polymesh v8 chain metadata.
 * withdrawUnbonded is unchanged between v7 and v8 (`withdrawUnbonded(numSlashingSpans)`); only the
 * material (specVersion / txVersion) differs from {@link WithdrawUnbondedBuilder}.
 */
export class V8WithdrawUnbondedBuilder extends WithdrawUnbondedBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }
}
