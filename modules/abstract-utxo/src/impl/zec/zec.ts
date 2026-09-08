/**
 * @prettier
 */
import { BitGoBase } from '@bitgo/sdk-core';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName } from '../../names';

import { isShieldedZcashAddress } from './address';

export class Zec extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'zec';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Zec {
    return new Zec(bitgo);
  }

  isValidAddress(address: string, param?: { anyFormat?: boolean; allowLightning?: boolean } | boolean): boolean {
    if (super.isValidAddress(address, param)) {
      return true;
    }
    return isShieldedZcashAddress(address, this.name as fixedScriptWallet.ZcashNetworkName);
  }
}
