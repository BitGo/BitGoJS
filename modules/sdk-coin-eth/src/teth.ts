import { BaseCoin, BitGoBase } from '@bitgo-beta/sdk-core';
import { Eth } from './eth';
import { BaseCoin as StaticsBaseCoin } from '@bitgo-beta/statics';

export class Teth extends Eth {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Teth(bitgo, staticsCoin);
  }
}
