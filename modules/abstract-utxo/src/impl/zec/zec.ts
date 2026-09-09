/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';
import { zcashAddress } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName } from '../../names';

export class Zec extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'zec';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Zec {
    return new Zec(bitgo);
  }

  isValidAddress(address: string, param?: { anyFormat?: boolean; allowLightning?: boolean } | boolean): boolean {
    return (
      zcashAddress.hasTransparentReceiver(address, this.wasmName) ||
      zcashAddress.hasOrchardReceiver(address, this.wasmName)
    );
  }
}
