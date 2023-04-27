/**
 * Testnet Bsc
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';

import { Bsc } from './bsc';

export class Tbsc extends Bsc {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('0a205427-f7c9-48a4-a238-c4b33ba6384d');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tbsc(bitgo);
  }

  /** @inheritDoc */
  allowsAccountConsolidations(): boolean {
    return true;
  }
}
