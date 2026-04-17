/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatCAD } from './fiatcad';

export class TfiatCAD extends FiatCAD {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatCAD(bitgo);
  }

  getChain() {
    return 'tfiatcad';
  }

  getFullName() {
    return 'Testnet Canadian Dollar';
  }
}
