import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Near } from './near';

export class TNear extends Near {
  constructor(bitgo: BitGo) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new TNear(bitgo);
  }

  getChain(): string {
    return 'tnear';
  }

  getFullName(): string {
    return 'Testnet Near';
  }
}
