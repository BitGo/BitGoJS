/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Fiat } from './fiat';

export class Tfiat extends Fiat {
  constructor(bitgo: BitGo) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tfiat(bitgo);
  }

  getChain() {
    return 'tfiat';
  }

  getFullName() {
    return 'Test Fiat';
  }
}
