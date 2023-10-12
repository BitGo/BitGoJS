/**
 * @prettier
 */
import { MPCAlgorithm } from '@bitgo/sdk-core';
import { EthLikeToken } from './ethLikeToken';

export abstract class EthLikeMPCToken extends EthLikeToken {
  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }
}
