import { BaseCoin } from '../baseCoin';
import { Eth } from './eth';

export class Teth extends Eth {

  static createInstance(bitgo: any): BaseCoin {
    return new Teth(bitgo);
  }

  getChain() {
    return 'teth';
  }

  getFullName() {
    return 'Testnet Ethereum';
  }
}
