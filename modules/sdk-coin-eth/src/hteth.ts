import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Eth } from './eth';

export class Hteth extends Eth {
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
    this.sendMethodName = 'sendMultiSig';
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Hteth(bitgo, staticsCoin);
  }

  getChain() {
    return 'hteth';
  }

  getFullName() {
    return 'Goerli Testnet Ethereum';
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }
}
