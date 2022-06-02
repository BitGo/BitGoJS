/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { AbstractEthLikeCoin } from './abstractEthLikeCoin';
import { Rbtc as RbtcAccountLib } from '@bitgo/account-lib';

export class Rbtc extends AbstractEthLikeCoin {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Rbtc(bitgo, staticsCoin);
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new RbtcAccountLib.KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }
}
