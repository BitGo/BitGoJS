import { BaseCoin } from '../baseCoin';
import { Susd } from './susd';

export class Tsusd extends Susd {

  static createInstance(bitgo: any): BaseCoin {
    return new Tsusd(bitgo);
  }

  getChain() {
    return 'tsusd';
  }

  getFullName() {
    return 'Test Silvergate USD';
  }
}
