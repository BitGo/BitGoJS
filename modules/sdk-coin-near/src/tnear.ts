import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Near } from './near';

export class TNear extends Near {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('5f076cd2-fbb6-4ef6-9aa6-adc0d8851b4b');
  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TNear(bitgo);
  }
}
