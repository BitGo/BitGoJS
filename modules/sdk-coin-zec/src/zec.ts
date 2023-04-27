/**
 * @prettier
 */
import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

export class Zec extends AbstractUtxoCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('508f6b53-1e6e-41fd-b541-b2498b7c4b61');
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.zcash);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Zec(bitgo);
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
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

  supportsBlockTarget() {
    return false;
  }
}
