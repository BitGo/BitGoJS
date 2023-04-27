import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

export class Ltc extends AbstractUtxoCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('9c8097f1-5d2c-4a62-a94c-96c271c0e5e0');
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

  getId(): string {
    return this._staticsCoin.id;
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  supportsBlockTarget(): boolean {
    return false;
  }
}
