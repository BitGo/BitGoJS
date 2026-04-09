/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatAED } from './fiataed';

export class TfiatAED extends FiatAED {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatAED(bitgo);
  }

  getChain() {
    return 'tfiataed';
  }

  getFullName() {
    return 'Testnet United Arab Emirates Dirham';
  }
}
