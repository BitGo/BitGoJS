/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatTRY } from './fiattry';

export class TfiatTRY extends FiatTRY {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatTRY(bitgo);
  }

  getChain() {
    return 'tfiattry';
  }

  getFullName() {
    return 'Testnet Turkish Lira';
  }
}
