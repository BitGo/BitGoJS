/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '../';
import { FiatZAR } from './fiatzar';

export class TfiatZAR extends FiatZAR {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TfiatZAR(bitgo);
  }

  getChain() {
    return 'tfiatzar';
  }

  getFullName() {
    return 'Testnet South African Rand';
  }
}
