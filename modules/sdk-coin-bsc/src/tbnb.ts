/**
 * Testnet Bsc
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

import { Bnb } from './bnb';

export class Tbnb extends Bnb {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tbnb(bitgo, staticsCoin);
  }

  /** @inheritDoc */
  allowsAccountConsolidations(): boolean {
    return true;
  }
}
