/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names.js';

import { Doge } from './doge.js';

export class Tdoge extends Doge {
  readonly name: UtxoCoinName = 'tdoge';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }
  static createInstance(bitgo: BitGoBase): Tdoge {
    return new Tdoge(bitgo);
  }
}
