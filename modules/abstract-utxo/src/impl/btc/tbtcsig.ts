/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names.js';

import { Btc } from './btc.js';

export class Tbtcsig extends Btc {
  readonly name: UtxoCoinName = 'tbtcsig';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbtcsig {
    return new Tbtcsig(bitgo);
  }
}
