import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Zec } from './zec';

export class Tzec extends Zec {
  readonly name: UtxoCoinName = 'tzec';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tzec {
    return new Tzec(bitgo);
  }
}
