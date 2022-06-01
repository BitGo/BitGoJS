/**
 * @prettier
 */
import { BaseCoin } from '@bitgo/sdk-core';
import { BitGo } from '../../bitgo';
import { Susd } from './susd';

export class Tsusd extends Susd {
  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tsusd(bitgo);
  }

  getChain() {
    return 'tsusd';
  }

  getFullName() {
    return 'Test Silvergate USD';
  }
}
