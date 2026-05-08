/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Bch } from './bch';

export class Tbch extends Bch {
  readonly name: UtxoCoinName = 'tbch';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbch {
    return new Tbch(bitgo);
  }
}
