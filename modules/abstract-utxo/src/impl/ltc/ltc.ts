import { BitGoBase } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin.js';
import { UtxoCoinName } from '../../names.js';

export class Ltc extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'ltc';

  static createInstance(bitgo: BitGoBase): Ltc {
    return new Ltc(bitgo);
  }
}
