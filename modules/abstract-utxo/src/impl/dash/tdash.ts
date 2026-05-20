/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Dash } from './dash';

export class Tdash extends Dash {
  readonly name: UtxoCoinName = 'tdash';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }
  static createInstance(bitgo: BitGoBase): Tdash {
    return new Tdash(bitgo);
  }
}
