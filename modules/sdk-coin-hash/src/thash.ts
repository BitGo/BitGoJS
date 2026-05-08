/**
 * Testnet Hash
 *
 * @format
 */
import { AddressFormat, BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { NetworkType, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Hash } from './hash';
import { HashUtils } from './lib/utils';
import { KeyPair } from './lib';

export class Thash extends Hash {
  protected readonly _utils: HashUtils;
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
    this._utils = new HashUtils(NetworkType.TESTNET);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Thash(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(publicKey: string): string {
    return new KeyPair({ pub: publicKey }).getAddress(AddressFormat.testnet);
  }
}
