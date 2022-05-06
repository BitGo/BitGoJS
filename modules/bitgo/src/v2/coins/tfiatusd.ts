/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { FiatUsd } from './fiatusd';

export class TfiatUsd extends FiatUsd {
  static createInstance(bitgo: BitGo): BaseCoin {
    return new TfiatUsd(bitgo);
  }

  getChain() {
    return 'tfiatusd';
  }

  getFullName() {
    return 'Testnet US Dollar';
  }
}
