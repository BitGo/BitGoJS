/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Btc } from './btc';

export class Tbtcbgsig extends Btc {
  readonly name: UtxoCoinName = 'tbtcbgsig';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbtcbgsig {
    return new Tbtcbgsig(bitgo);
  }
}
