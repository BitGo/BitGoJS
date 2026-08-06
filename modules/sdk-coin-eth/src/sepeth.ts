import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Eth } from './eth';

export class Sepeth extends Eth {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Sepeth(bitgo, staticsCoin);
  }
}
