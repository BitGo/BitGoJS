/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatDKK } from './fiatdkk';

export class TfiatDKK extends FiatDKK {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatDKK(bitgo);
  }

  getChain() {
    return 'tfiatdkk';
  }

  getFullName() {
    return 'Testnet Danish Krone';
  }
}
