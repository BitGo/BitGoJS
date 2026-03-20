import { BitGoBase } from '@bitgo/sdk-core';

import { Bch } from '../bch/bch.js';
import { UtxoCoinName } from '../../names.js';

export class Bsv extends Bch {
  readonly name: UtxoCoinName = 'bsv';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Bsv {
    return new Bsv(bitgo);
  }
}
