/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names.js';

import { Bcha } from './bcha.js';

export class Tbcha extends Bcha {
  readonly name: UtxoCoinName = 'tbcha';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbcha {
    return new Tbcha(bitgo);
  }
}
