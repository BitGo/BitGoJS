import { BitGoBase } from '@bitgo/sdk-core';

import { UtxoCoinName, WasmUtxoCoinName } from '../../names';

import { Tbtc } from './tbtc';

export class Tbtcstxsignet extends Tbtc {
  readonly name: UtxoCoinName = 'tbtcstxsignet';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Tbtcstxsignet {
    return new Tbtcstxsignet(bitgo);
  }

  override get wasmName(): WasmUtxoCoinName {
    return 'tbtcsig';
  }
}
