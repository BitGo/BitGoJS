import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { AvaxP } from './avaxp';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';

export class TavaxP extends AvaxP {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('ea330a11-3814-4b74-994b-e61e05b34ec3');

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TavaxP(bitgo);
  }
}
