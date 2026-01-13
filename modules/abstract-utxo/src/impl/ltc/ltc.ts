import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName } from '../../names';

export class Ltc extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'ltc';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
    // use legacy script hash version, which is the current Bitcoin one
    this.altScriptHash = utxolib.networks.bitcoin.scriptHash;
    // do not support alt destinations in prod
    this.supportAltScriptDestination = false;
  }

  static createInstance(bitgo: BitGoBase): Ltc {
    return new Ltc(bitgo);
  }
}
