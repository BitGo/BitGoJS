/**
 * Testnet Bsc
 */
import { BaseCoin, BitGoBase } from '@bitgo-beta/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo-beta/statics';

import { Bsc } from './bsc';

export class Tbsc extends Bsc {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tbsc(bitgo, staticsCoin);
  }
}
