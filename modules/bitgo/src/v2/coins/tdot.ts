import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Dot } from './dot';

export class Tdot extends Dot {
  constructor(bitgo: BitGo) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tdot(bitgo);
  }

  getChain(): string {
    return 'tdot';
  }

  getFullName(): string {
    return 'Testnet Polkadot';
  }
}
