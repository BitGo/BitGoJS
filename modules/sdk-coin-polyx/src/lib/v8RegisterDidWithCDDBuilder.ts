import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { RegisterDidWithCDDBuilder } from './registerDidWithCDDBuilder';
import utils from './utils';

/**
 * Builds a Polymesh identity.cddRegisterDidWithCdd transaction against
 * Polymesh v8 chain metadata. Identical behaviour to
 * RegisterDidWithCDDBuilder; only the material differs.
 */
export class V8RegisterDidWithCDDBuilder extends RegisterDidWithCDDBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }
}
