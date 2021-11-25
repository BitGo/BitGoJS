/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { Bch } from './bch';
import { BaseCoin } from '../baseCoin';

export class Bcha extends Bch {
  static createInstance(bitgo: BitGo): BaseCoin {
    return new Bcha(bitgo);
  }

  getChain(): string {
    return 'bcha';
  }

  getFamily(): string {
    return 'bcha';
  }

  getFullName(): string {
    return 'Bitcoin ABC';
  }
}
