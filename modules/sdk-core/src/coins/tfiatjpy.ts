/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatJPY } from './fiatjpy';

export class TfiatJPY extends FiatJPY {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatJPY(bitgo);
  }

  getChain() {
    return 'tfiatjpy';
  }

  getFullName() {
    return 'Testnet Japanese Yen';
  }
}
