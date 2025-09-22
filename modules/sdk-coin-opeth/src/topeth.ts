/**
 * Testnet Opeth
 */
import { BaseCoin, BitGoBase } from '@bitgo-beta/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo-beta/statics';

import { Opeth } from './opeth';

export class Topeth extends Opeth {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Topeth(bitgo, staticsCoin);
  }
}
