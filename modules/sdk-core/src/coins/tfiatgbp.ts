/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatGBP } from './fiatgbp';

export class TfiatGBP extends FiatGBP {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatGBP(bitgo);
  }

  getChain() {
    return 'tfiatgbp';
  }

  getFullName() {
    return 'Testnet British Pound Sterling';
  }
}
