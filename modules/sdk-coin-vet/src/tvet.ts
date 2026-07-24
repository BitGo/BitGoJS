/**
 * Testnet Vechain
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Vet } from './vet';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Tvet extends Vet {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tvet(bitgo, staticsCoin);
  }

  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return 'tvet';
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return 'Testnet VeChain';
  }
}
