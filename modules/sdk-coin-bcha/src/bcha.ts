import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { Bch } from '@bitgo/sdk-coin-bch';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { UtxoNetwork } from '@bitgo/abstract-utxo';

export class Bcha extends Bch {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('941587ce-1c7a-4305-b908-15455d15e961');
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.ecash);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Bcha(bitgo);
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
