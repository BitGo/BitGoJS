import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName, WasmUtxoCoinName } from '../../names';

import { Tbtc } from './tbtc';

export class Tbtcstx extends Tbtc {
  readonly name: UtxoCoinName = 'tbtcstx';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbtcstx {
    return new Tbtcstx(bitgo);
  }

  override get wasmName(): WasmUtxoCoinName {
    return 'tbtcreg';
  }
}
