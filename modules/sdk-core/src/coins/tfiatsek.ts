/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatSEK } from './fiatsek';

export class TfiatSEK extends FiatSEK {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatSEK(bitgo);
  }

  getChain() {
    return 'tfiatsek';
  }

  getFullName() {
    return 'Testnet Swedish Krona';
  }
}
