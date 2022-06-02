/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { FiatUsd } from './fiatusd';

export class TfiatUsd extends FiatUsd {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatUsd(bitgo);
  }

  getChain() {
    return 'tfiatusd';
  }

  getFullName() {
    return 'Testnet US Dollar';
  }
}
