import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

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

  getChain(): string {
    return 'ltc';
  }

  getFamily(): string {
    return 'ltc';
  }

  getFullName(): string {
    return 'Litecoin';
  }

  supportsBlockTarget(): boolean {
    return false;
  }
}
