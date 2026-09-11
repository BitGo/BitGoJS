import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Tbtcstx } from './tbtcstx';

export class Tbtcstxprivate1 extends Tbtcstx {
  readonly name: UtxoCoinName = 'tbtcstxprivate1';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbtcstxprivate1 {
    return new Tbtcstxprivate1(bitgo);
  }
}
