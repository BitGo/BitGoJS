/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names.js';

import { Bch } from './bch.js';

export class Tbch extends Bch {
  readonly name: UtxoCoinName = 'tbch';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbch {
    return new Tbch(bitgo);
  }
}
