/**
 * @prettier
 */

import request from 'superagent';
import { BaseCoin, BitGoBase, common } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { AbstractEthLikeNewCoins, TransactionBuilder as EthLikeTransactionBuilder } from '@bitgo/abstract-eth';
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
    const token = common.Environments[this.bitgo.getEnv()].optimisticEtherscanApiToken;
    if (token) {
      query.apikey = token;
    }
    const response = await request
      .get(common.Environments[this.bitgo.getEnv()].optimisticEtherscanBaseUrl + '/api')
      .query(query);

    if (!response.ok) {
      throw new Error('could not reach Optimism Etherscan');
    }

    if (response.body.status === '0' && response.body.message === 'NOTOK') {
      throw new Error('Optimism Etherscan rate limit reached');
    }
    return response.body;
  }
}
