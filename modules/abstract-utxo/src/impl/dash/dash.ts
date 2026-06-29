import { BitGoBase } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName } from '../../names';

export class Dash extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'dash';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Dash {
    return new Dash(bitgo);
  }
}
