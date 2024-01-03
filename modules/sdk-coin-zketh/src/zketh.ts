/**
 * @prettier
 */
import request from 'superagent';
import { BaseCoin, BitGoBase, common } from '@bitgo/sdk-core';
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

  /**
   * Make a query to zkSync explorer for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from zkSync explorer
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const response = await request
      .get(common.Environments[this.bitgo.getEnv()].zksyncExplorerBaseUrl + '/api')
      .query(query);

    if (!response.ok) {
      throw new Error('could not reach zkSync explorer');
    }

    if (response.body.status === '0' && response.body.message === 'NOTOK') {
      throw new Error('zkSync explorer rate limit reached');
    }
    return response.body;
  }
}
