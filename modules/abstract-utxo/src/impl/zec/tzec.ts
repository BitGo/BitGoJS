import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names.js';

import { Zec } from './zec.js';

export class Tzec extends Zec {
  readonly name: UtxoCoinName = 'tzec';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tzec {
    return new Tzec(bitgo);
  }
}
