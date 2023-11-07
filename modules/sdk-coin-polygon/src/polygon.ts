/**
 * @prettier
 */
import request from 'superagent';
import { AbstractEthLikeNewCoins } from '@bitgo/abstract-eth';
import { BaseCoin, BitGoBase, common, MPCAlgorithm } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { TransactionBuilder } from './lib';

export class Polygon extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Polygon(bitgo, staticsCoin);
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  public getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /**
   * Make a query to Polygonscan for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from Polygonscan
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<any> {
    const token = common.Environments[this.bitgo.getEnv()].polygonscanApiToken;
    if (token) {
      query.apikey = token;
    }
    const response = await request
      .get(common.Environments[this.bitgo.getEnv()].polygonscanBaseUrl + '/api')
      .query(query);

    if (!response.ok) {
      throw new Error('could not reach Polygonscan');
    }

    if (response.body.status === '0' && response.body.message === 'NOTOK') {
      throw new Error('Polygonscan rate limit reached');
    }
    return response.body;
  }

  /** @inheritDoc */
  supportsMessageSigning(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsSigningTypedData(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }
}
