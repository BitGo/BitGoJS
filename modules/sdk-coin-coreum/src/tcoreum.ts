/**
 * Testnet Coreum
 *
 * @format
 */
import { AddressFormat, BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseUnit, NetworkType, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Coreum } from './coreum';
import { KeyPair } from './lib';
import { CoreumUtils } from './lib/utils';

export class Tcoreum extends Coreum {
  protected readonly _utils: CoreumUtils;
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
    this._utils = new CoreumUtils(NetworkType.TESTNET);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tcoreum(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.TCOREUM;
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(publicKey: string): string {
    return new KeyPair({ pub: publicKey }).getAddress(AddressFormat.testnet);
  }
}
