import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Eth } from './eth';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Teth extends Eth {
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  protected constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
    this.sendMethodName = 'sendMultiSig';
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Teth(bitgo, staticsCoin);
  }

  getChain() {
    return 'teth';
  }

  getFullName() {
    return 'Testnet Ethereum';
  }
}
