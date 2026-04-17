/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatAUD } from './fiataud';

export class TfiatAUD extends FiatAUD {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatAUD(bitgo);
  }

  getChain() {
    return 'tfiataud';
  }

  getFullName() {
    return 'Testnet Australian Dollar';
  }
}
