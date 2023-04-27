import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

export class Btg extends AbstractUtxoCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('8feb110d-0d68-44ce-ae97-b8c30ec870a9');
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoingold);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Btg(bitgo);
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
