/**
 * Testnet Osmo
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Osmo } from './osmo';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Tosmo extends Osmo {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tosmo(bitgo, staticsCoin);
  }

  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return this._staticsCoin.name;
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return this._staticsCoin.fullName;
  }
}
