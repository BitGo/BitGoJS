/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Btc } from './btc';

export class Tbtcsig extends Btc {
  readonly name: UtxoCoinName = 'tbtcsig';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbtcsig {
    return new Tbtcsig(bitgo);
  }
}
