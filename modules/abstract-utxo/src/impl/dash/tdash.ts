/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names.js';

import { Dash } from './dash.js';

export class Tdash extends Dash {
  readonly name: UtxoCoinName = 'tdash';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }
  static createInstance(bitgo: BitGoBase): Tdash {
    return new Tdash(bitgo);
  }
}
