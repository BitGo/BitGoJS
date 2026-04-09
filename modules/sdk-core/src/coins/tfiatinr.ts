/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatINR } from './fiatinr';

export class TfiatINR extends FiatINR {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatINR(bitgo);
  }

  getChain() {
    return 'tfiatinr';
  }

  getFullName() {
    return 'Testnet Indian Rupee';
  }
}
