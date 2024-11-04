/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Celo } from './celo';
import { TestnetTransactionBuilder } from './lib';

export class Tcelo extends Celo {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tcelo(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): TestnetTransactionBuilder {
    return new TestnetTransactionBuilder(coins.get(this.getBaseChain()));
  }
}
