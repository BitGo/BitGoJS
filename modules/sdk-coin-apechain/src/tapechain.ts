/**
 * Testnet apechain
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo-beta/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo-beta/statics';
import { Apechain } from './apechain';

export class Tapechain extends Apechain {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tapechain(bitgo, staticsCoin);
  }
}
