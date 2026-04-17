/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatUYU } from './fiatuyu';

export class TfiatUYU extends FiatUYU {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatUYU(bitgo);
  }

  getChain() {
    return 'tfiatuyu';
  }

  getFullName() {
    return 'Testnet Uruguayan Peso';
  }
}
