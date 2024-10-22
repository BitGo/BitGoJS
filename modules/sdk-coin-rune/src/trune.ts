/**
 * Testnet Rune
 *
 * @format
 */
import { AddressFormat, BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseUnit, NetworkType, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Rune } from './rune';
import { KeyPair } from './lib';
import { RuneUtils } from './lib/utils';

export class Trune extends Rune {
  protected readonly _utils: RuneUtils;
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
    this._utils = new RuneUtils(NetworkType.TESTNET);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Trune(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.RUNE;
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(publicKey: string): string {
    return new KeyPair({ pub: publicKey }).getAddress(AddressFormat.testnet);
  }
}
