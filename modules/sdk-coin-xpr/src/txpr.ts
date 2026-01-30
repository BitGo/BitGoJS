import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Xpr } from './xpr';
import { TESTNET_CHAIN_ID } from './lib/constants';

export class Txpr extends Xpr {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Txpr(bitgo, staticsCoin);
  }

  getChain(): string {
    return 'txpr';
  }

  getFullName(): string {
    return 'Testnet Proton (XPR Network)';
  }

  getChainId(): string {
    return TESTNET_CHAIN_ID;
  }
}
