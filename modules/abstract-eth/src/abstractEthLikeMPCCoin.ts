/**
 * @prettier
 */
import { MPCAlgorithm } from '@bitgo/sdk-core';
import { AbstractEthLikeCoin } from './abstractEthLikeCoin';

export abstract class AbstractEthLikeMPCCoin extends AbstractEthLikeCoin {
  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }
}
