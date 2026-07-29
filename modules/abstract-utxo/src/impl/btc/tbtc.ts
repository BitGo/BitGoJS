/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Btc } from './btc';

export class Tbtc extends Btc {
  readonly name: UtxoCoinName = 'tbtc';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbtc {
    return new Tbtc(bitgo);
  }
}
