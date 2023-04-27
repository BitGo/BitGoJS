import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { AbstractEthLikeCoin } from '@bitgo/abstract-eth';

export class <%= constructor %> extends AbstractEthLikeCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new <%= constructor %>(bitgo, staticsCoin);
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  /**
   * Get the base chain that the coin exists on.
   */
  getBaseChain(): string {
    return this.getChain();
  }

  getFamily(): string {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }
}
