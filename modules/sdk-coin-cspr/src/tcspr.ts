import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Cspr } from './cspr';

export class Tcspr extends Cspr {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('bd8f0b27-d13b-41c8-9f60-84fc1f201d89');

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tcspr(bitgo);
  }
}
