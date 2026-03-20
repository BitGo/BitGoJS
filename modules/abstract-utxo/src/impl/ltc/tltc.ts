import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names.js';

import { Ltc } from './ltc.js';

export class Tltc extends Ltc {
  readonly name: UtxoCoinName = 'tltc';

  static createInstance(bitgo: BitGoBase): Tltc {
    return new Tltc(bitgo);
  }
}
