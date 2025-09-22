/**
 * @prettier
 */
import { BaseCoin, BitGoBase, common, MPCAlgorithm, MultisigType, multisigTypes } from '@bitgo-beta/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins, ethGasConfigs } from '@bitgo-beta/statics';
import {
  AbstractEthLikeNewCoins,
  TransactionBuilder as EthLikeTransactionBuilder,
  recoveryBlockchainExplorerQuery,
} from '@bitgo-beta/abstract-eth';
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

  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /**
   * Make a query to Optimism Etherscan for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @param {string} apiKey optional API key to use instead of the one from the environment
   * @returns {Promise<Object>} response from Optimism Etherscan
   */
  async recoveryBlockchainExplorerQuery(
    query: Record<string, string>,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    const apiToken = apiKey || common.Environments[this.bitgo.getEnv()].optimisticEtherscanApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].optimisticEtherscanBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }

  /**
   * Check whether gas limit passed in by user are within our max and min bounds
   * If they are not set, set them to the defaults
   * @param {number} userGasLimit user defined gas limit
   * @returns {number} the gas limit to use for this transaction
   */
  setGasLimit(userGasLimit?: number): number {
    if (!userGasLimit) {
      return ethGasConfigs.defaultGasLimit;
    }
    const gasLimitMax = ethGasConfigs.maximumGasLimit;
    const gasLimitMin = ethGasConfigs.newEthLikeCoinsMinGasLimit;
    if (userGasLimit < gasLimitMin || userGasLimit > gasLimitMax) {
      throw new Error(`Gas limit must be between ${gasLimitMin} and ${gasLimitMax}`);
    }
    return userGasLimit;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }
}
