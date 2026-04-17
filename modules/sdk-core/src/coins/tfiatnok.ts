/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatNOK } from './fiatnok';

export class TfiatNOK extends FiatNOK {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatNOK(bitgo);
  }

  getChain() {
    return 'tfiatnok';
  }

  getFullName() {
    return 'Testnet Norwegian Krone';
  }
}
