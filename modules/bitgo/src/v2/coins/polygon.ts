/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { AbstractEthLikeCoin } from './abstractEthLikeCoin';
import { Polygon as PolygonAccountLib } from '@bitgo/account-lib';

export class Polygon extends AbstractEthLikeCoin {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Polygon(bitgo, staticsCoin);
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new PolygonAccountLib.KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }
}
