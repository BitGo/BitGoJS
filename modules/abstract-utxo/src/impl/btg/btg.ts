import { BitGoBase } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName } from '../../names';

export class Btg extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'btg';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Btg {
    return new Btg(bitgo);
  }
}
