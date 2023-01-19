/**
 * Testnet Cosmos
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Atom } from './atom';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Tatom extends Atom {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tatom(bitgo, staticsCoin);
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
