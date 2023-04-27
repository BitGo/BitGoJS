/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';

import { AvaxC } from './avaxc';

export class TavaxC extends AvaxC {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('91a971d1-1dc1-4953-8828-82bef859acfa');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new TavaxC(bitgo);
  }
}
