import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

export class Dash extends AbstractUtxoCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('0739be6a-c72e-468d-9464-ca5601965708');
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.dash);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Dash(bitgo);
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
