/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names.js';

import { Bsv } from './bsv.js';

export class Tbsv extends Bsv {
  readonly name: UtxoCoinName = 'tbsv';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbsv {
    return new Tbsv(bitgo);
  }
}
