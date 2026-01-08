/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Doge } from './doge';

export class Tdoge extends Doge {
  readonly name: UtxoCoinName = 'tdoge';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }
  static createInstance(bitgo: BitGoBase): Tdoge {
    return new Tdoge(bitgo);
  }
}
