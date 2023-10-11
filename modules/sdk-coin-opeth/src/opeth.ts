import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { AbstractEthLikeMPCCoin } from '@bitgo/abstract-eth';
import { TransactionBuilder as EthTransactionBuilder } from '@bitgo/sdk-coin-eth';
import { TransactionBuilder } from './lib';

export class Opeth extends AbstractEthLikeMPCCoin {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Opeth(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): EthTransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }
}
