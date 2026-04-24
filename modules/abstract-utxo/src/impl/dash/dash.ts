import { BitGoBase } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin.js';
import { UtxoCoinName } from '../../names.js';

export class Dash extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'dash';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Dash {
    return new Dash(bitgo);
  }
}
