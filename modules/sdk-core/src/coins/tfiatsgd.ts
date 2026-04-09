/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatSGD } from './fiatsgd';

export class TfiatSGD extends FiatSGD {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatSGD(bitgo);
  }

  getChain() {
    return 'tfiatsgd';
  }

  getFullName() {
    return 'Testnet Singapore Dollar';
  }
}
