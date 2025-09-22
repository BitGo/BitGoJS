import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo-beta/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo-beta/sdk-core';
import * as utxolib from '@bitgo-beta/utxo-lib';

export class Ltc extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.litecoin);
    // use legacy script hash version, which is the current Bitcoin one
    this.altScriptHash = utxolib.networks.bitcoin.scriptHash;
    // do not support alt destinations in prod
    this.supportAltScriptDestination = false;
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Ltc(bitgo);
  }
}
