import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { UtxoCoinName } from '../../names';

import { Ltc } from './ltc';

export class Tltc extends Ltc {
  readonly name: UtxoCoinName = 'tltc';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
    this.altScriptHash = utxolib.networks.testnet.scriptHash;
    // support alt destinations on test
    this.supportAltScriptDestination = false;
  }
  static createInstance(bitgo: BitGoBase): Tltc {
    return new Tltc(bitgo);
  }
}
