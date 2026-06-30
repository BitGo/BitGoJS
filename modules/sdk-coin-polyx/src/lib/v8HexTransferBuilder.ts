import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { HexTransferBuilder } from './hexTransferBuilder';
import utils from './utils';

/**
 * Builds a POLYX balances.transferWithMemo transaction using the hex
 * (NEW) memo encoding against Polymesh v8 chain metadata. Identical
 * behaviour to HexTransferBuilder; only the material differs.
 */
export class V8HexTransferBuilder extends HexTransferBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }
}
