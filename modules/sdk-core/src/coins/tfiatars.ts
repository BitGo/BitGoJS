/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatARS } from './fiatars';

export class TfiatARS extends FiatARS {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatARS(bitgo);
  }

  getChain() {
    return 'tfiatars';
  }

  getFullName() {
    return 'Testnet Argentine Peso';
  }
}
