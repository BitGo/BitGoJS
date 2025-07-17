import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { CosmosCoin } from '@bitgo/abstract-cosmos';

/**
 * Shared Cosmos coin implementation that uses configuration from statics
 * instead of requiring individual coin modules
 */
export class CosmosSharedCoin extends CosmosCoin {
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new CosmosCoin(bitgo);
  }
}
