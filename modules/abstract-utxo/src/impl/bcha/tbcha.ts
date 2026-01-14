/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Bcha } from './bcha';

export class Tbcha extends Bcha {
  readonly name: UtxoCoinName = 'tbcha';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbcha {
    return new Tbcha(bitgo);
  }
}
