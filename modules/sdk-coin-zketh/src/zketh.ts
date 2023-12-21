/**
 * @prettier
 */
import { BaseCoin, BitGoBase, MPCAlgorithm } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { AbstractEthLikeNewCoins, TransactionBuilder as EthLikeTransactionBuilder } from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';

export class Zketh extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Zketh(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): EthLikeTransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return false;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }
}
