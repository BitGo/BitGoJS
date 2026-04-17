/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatKRW } from './fiatkrw';

export class TfiatKRW extends FiatKRW {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatKRW(bitgo);
  }

  getChain() {
    return 'tfiatkrw';
  }

  getFullName() {
    return 'Testnet South Korean Won';
  }
}
