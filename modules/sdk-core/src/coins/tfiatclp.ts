/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatCLP } from './fiatclp';

export class TfiatCLP extends FiatCLP {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatCLP(bitgo);
  }

  getChain() {
    return 'tfiatclp';
  }

  getFullName() {
    return 'Testnet Chilean Peso';
  }
}
