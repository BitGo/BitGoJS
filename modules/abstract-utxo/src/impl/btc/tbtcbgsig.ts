/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names.js';

import { Btc } from './btc.js';

export class Tbtcbgsig extends Btc {
  readonly name: UtxoCoinName = 'tbtcbgsig';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbtcbgsig {
    return new Tbtcbgsig(bitgo);
  }
}
