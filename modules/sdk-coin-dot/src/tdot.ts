import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Dot } from './dot';

export class Tdot extends Dot {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('85b966bd-d1cc-4a86-a937-b1afab659e7b');
  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tdot(bitgo);
  }
}
