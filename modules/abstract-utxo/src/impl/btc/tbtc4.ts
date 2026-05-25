/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Btc } from './btc';

export class Tbtc4 extends Btc {
  readonly name: UtxoCoinName = 'tbtc4';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbtc4 {
    return new Tbtc4(bitgo);
  }
}
