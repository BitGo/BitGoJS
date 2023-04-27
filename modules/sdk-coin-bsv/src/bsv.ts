import { UtxoNetwork } from '@bitgo/abstract-utxo';
import { Bch } from '@bitgo/sdk-coin-bch';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

export class Bsv extends Bch {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('f728cfc7-d0cf-4f99-bca0-d25273e65fcf');
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoinsv);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Bsv(bitgo);
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
}
