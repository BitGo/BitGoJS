/**
 * @prettier
 */
import { BaseCoin, BitGoBase, common } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  TransactionBuilder as EthLikeTransactionBuilder,
  recoveryBlockchainExplorerQuery,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';

export class Opeth extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Opeth(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): EthLikeTransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /**
   * Make a query to Optimism Etherscan for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from Optimism Etherscan
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const apiToken = common.Environments[this.bitgo.getEnv()].optimisticEtherscanApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].optimisticEtherscanBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }
}
