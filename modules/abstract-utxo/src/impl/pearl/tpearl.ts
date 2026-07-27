import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../../names';

import { Pearl } from './pearl';

export class Tpearl extends Pearl {
  readonly name: UtxoCoinName = 'tpearl';

  static createInstance(bitgo: BitGoBase): Tpearl {
    return new Tpearl(bitgo);
  }
}
