/**
 * @prettier
 */
import { AbstractEthLikeNewCoins, recoveryBlockchainExplorerQuery } from '@bitgo/abstract-eth';
import { BaseCoin, BitGoBase, common } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { KeyPair, TransactionBuilder } from './lib';

export class Etc extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Etc(bitgo, staticsCoin);
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /**
   * Make a query to Arbiscan for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from Arbiscan
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    // const apiToken = common.Environments[this.bitgo.getEnv()].arbiscanApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].etcNodeUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string);
  }
}
