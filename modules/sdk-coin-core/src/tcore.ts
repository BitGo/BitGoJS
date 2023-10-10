/**
 * Testnet Coreum
 *
 * @format
 */
import { AddressFormat, BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseUnit, NetworkType, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Core } from './core';
import { KeyPair } from './lib';
import { CoreUtils } from './lib/utils';

export class Tcore extends Core {
  protected readonly _utils: CoreUtils;
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
    this._utils = new CoreUtils(NetworkType.TESTNET);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tcore(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.TESTCORE;
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(publicKey: string): string {
    return new KeyPair({ pub: publicKey }).getAddress(AddressFormat.testnet);
  }
}
