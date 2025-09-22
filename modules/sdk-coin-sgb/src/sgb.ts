/***
 * @developerReferences
 * - Developer Hub: https://dev.flare.network/
 * - Doc: https://docs.flare.network/user/wallets/
 * @coinFullName Songbird
 * @coinWebsite https://songbird-explorer.flare.network
 */

import { BaseCoin, BitGoBase, common, MPCAlgorithm, MultisigType, multisigTypes } from '@bitgo-beta/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo-beta/statics';
import {
  AbstractEthLikeNewCoins,
  recoveryBlockchainExplorerQuery,
  UnsignedSweepTxMPCv2,
  RecoverOptions,
  OfflineVaultTxInfo,
} from '@bitgo-beta/abstract-eth';
import { TransactionBuilder } from './lib';

export class Sgb extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Sgb(bitgo, staticsCoin);
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
   * Make a query to Songbird explorer for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @param {string} apiKey optional API key to use instead of the one from the environment
   * @returns {Promise<Object>} response from Songbird explorer
   */
  async recoveryBlockchainExplorerQuery(
    query: Record<string, string>,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    const apiToken = apiKey || common.Environments[this.bitgo.getEnv()].sgbExplorerApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].sgbExplorerBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }
}
