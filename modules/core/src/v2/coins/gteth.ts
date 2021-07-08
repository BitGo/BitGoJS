import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Eth } from './eth';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Gteth extends Eth {
  protected constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Gteth(bitgo, staticsCoin);
  }

  getChain() {
    return 'gteth';
  }

  getFullName() {
    return 'Goerli Testnet Ethereum';
  }
}
