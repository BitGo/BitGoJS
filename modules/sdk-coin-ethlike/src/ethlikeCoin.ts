import EthereumCommon from '@ethereumjs/common';
import { AbstractEthLikeNewCoins, recoveryBlockchainExplorerQuery } from '@bitgo/abstract-eth';
import { BaseCoin, BitGoBase, common } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { EthLikeTransactionBuilder } from './lib';

export class EthLikeCoin extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new EthLikeCoin(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(common?: EthereumCommon): EthLikeTransactionBuilder {
    return new EthLikeTransactionBuilder(coins.get(this.getBaseChain()), common);
  }

  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const apiToken = common.Environments[this.bitgo.getEnv()][this.getFamily().toLowerCase() + 'ApiToken'];
    const explorerUrl = common.Environments[this.bitgo.getEnv()][this.getFamily().toLowerCase() + 'ExplorerUrl'];
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }
}
