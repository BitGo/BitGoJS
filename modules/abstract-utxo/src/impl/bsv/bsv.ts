import { BitGoBase } from '@bitgo/sdk-core';

import { Bch } from '../bch/bch';
import { UtxoCoinName } from '../../names';

export class Bsv extends Bch {
  readonly name: UtxoCoinName = 'bsv';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Bsv {
    return new Bsv(bitgo);
  }
}
