/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName } from '../../names';

export class Zec extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'zec';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Zec {
    return new Zec(bitgo);
  }
}
