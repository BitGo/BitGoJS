/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo-beta/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo-beta/statics';
import { Etc } from './etc';

export class Tetc extends Etc {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tetc(bitgo, staticsCoin);
  }
}
