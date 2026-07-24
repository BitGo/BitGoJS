/**
 * Testnet <%= constructor %>
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { <%= constructor %> } from './<%= symbol %>';

export class <%= testnetConstructor %> extends <%= constructor %> {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new <%= testnetConstructor %>(bitgo, staticsCoin);
  }
}
