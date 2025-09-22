/***
 * @developerReferences
 * - Developer Hub: https://docs.soneium.org/soneium-chain/quick-start/info
 * - Doc: https://docs.soneium.org/
 *
 * @coinFullName Soneium
 * @coinWebsite https://docs.soneium.org/soneium-chain/quick-start/info
 */

import { BaseCoin, BitGoBase, MPCAlgorithm, MultisigType, multisigTypes } from '@bitgo-beta/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins, ethGasConfigs } from '@bitgo-beta/statics';
import {
  AbstractEthLikeNewCoins,
  UnsignedSweepTxMPCv2,
  RecoverOptions,
  OfflineVaultTxInfo,
} from '@bitgo-beta/abstract-eth';
import { TransactionBuilder } from './lib';
import * as utils from './lib/utils';

export class Soneium extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Soneium(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  protected async buildUnsignedSweepTxnTSS(params: RecoverOptions): Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    return this.buildUnsignedSweepTxnMPCv2(params);
  }

  /**
   * Make a query to Soneium explorer for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @param {string} apiKey optional API key to use instead of the one from the environment
   * @returns {Promise<Object>} response from Soneium explorer
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, any>): Promise<any> {
    return await utils.recoveryBlockchainExplorerQuery(query, this.bitgo.getEnv());
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
}
