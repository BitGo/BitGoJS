import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Eth } from './eth';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Teth extends Eth {
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
    this.sendMethodName = 'sendMultiSig';
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Teth(bitgo, staticsCoin);
  }

  getChain() {
    return 'teth';
  }

  getFullName() {
    return 'Testnet Ethereum';
  }
}
