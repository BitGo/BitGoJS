/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatCNY } from './fiatcny';

export class TfiatCNY extends FiatCNY {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatCNY(bitgo);
  }

  getChain() {
    return 'tfiatcny';
  }

  getFullName() {
    return 'Testnet Chinese Yuan';
  }
}
