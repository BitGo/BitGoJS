import { BitGoBase } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName } from '../../names';

export class Ltc extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'ltc';

  static createInstance(bitgo: BitGoBase): Ltc {
    return new Ltc(bitgo);
  }
}
