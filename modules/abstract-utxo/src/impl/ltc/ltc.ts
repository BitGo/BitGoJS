import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin, UtxoNetwork } from '../../abstractUtxoCoin';

export class Ltc extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.litecoin);
    // use legacy script hash version, which is the current Bitcoin one
    this.altScriptHash = utxolib.networks.bitcoin.scriptHash;
    // do not support alt destinations in prod
    this.supportAltScriptDestination = false;
  }

  static createInstance(bitgo: BitGoBase): Ltc {
    return new Ltc(bitgo);
  }
}
