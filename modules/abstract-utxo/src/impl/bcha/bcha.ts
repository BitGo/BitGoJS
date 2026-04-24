import { BitGoBase } from '@bitgo/sdk-core';

import { Bch } from '../bch/bch.js';
import { UtxoCoinName } from '../../names.js';

export class Bcha extends Bch {
  readonly name: UtxoCoinName = 'bcha';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Bcha {
    return new Bcha(bitgo);
  }
}
