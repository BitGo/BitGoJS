import { AddressFormat, BaseCoin, BitGoBase } from '@bitgo-beta/sdk-core';
import { BaseCoin as StaticsBaseCoin, BaseUnit, NetworkType } from '@bitgo-beta/statics';
import { Cronos } from './cronos';
import { Utils } from './lib/utils';
import { KeyPair } from './lib/keyPair';

export class Tcronos extends Cronos {
  protected readonly _utils: Utils;
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
    this._utils = new Utils(NetworkType.TESTNET);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tcronos(bitgo, staticsCoin);
  }

  getDenomination(): string {
    return BaseUnit.TCRONOS;
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(publicKey: string): string {
    return new KeyPair({ pub: publicKey }).getAddress(AddressFormat.testnet);
  }
}
