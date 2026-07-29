import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Ltc } from './ltc';

export class Tltc extends Ltc {
  readonly name: UtxoCoinName = 'tltc';

  static createInstance(bitgo: BitGoBase): Tltc {
    return new Tltc(bitgo);
  }
}
