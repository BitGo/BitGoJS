import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Sol } from './sol';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';

export class Tsol extends Sol {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('16445f37-624c-4343-90f2-c62429551871');

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tsol(bitgo);
  }
}
