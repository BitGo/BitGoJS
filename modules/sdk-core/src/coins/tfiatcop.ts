/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatCOP } from './fiatcop';

export class TfiatCOP extends FiatCOP {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatCOP(bitgo);
  }

  getChain() {
    return 'tfiatcop';
  }

  getFullName() {
    return 'Testnet Colombian Peso';
  }
}
