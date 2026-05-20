import { BitGoBase } from '@bitgo/sdk-core';

import { Bch } from '../bch/bch';
import { UtxoCoinName } from '../../names';

export class Bcha extends Bch {
  readonly name: UtxoCoinName = 'bcha';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Bcha {
    return new Bcha(bitgo);
  }
}
