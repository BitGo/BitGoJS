import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Eth } from './eth';

export class Gteth extends Eth {
  static createInstance(bitgo: BitGo): BaseCoin {
    return new Gteth(bitgo);
  }

  getChain() {
    return 'gteth';
  }

  getFullName() {
    return 'Goerli Testnet Ethereum';
  }
}
