/***
 * @developerReferences
 * - Developer Hub: https://dev.flare.network/
 * - Doc: https://docs.flare.network/user/wallets/
 *
 * @coinFullName Flare
 * @coinWebsite https://flare-explorer.flare.network
 */

import { BaseCoin, BitGoBase, common, MPCAlgorithm, MultisigType, multisigTypes } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  recoveryBlockchainExplorerQuery,
  UnsignedSweepTxMPCv2,
  RecoverOptions,
  OfflineVaultTxInfo,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';

export class Flr extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Flr(bitgo, staticsCoin);
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

  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const apiToken = common.Environments[this.bitgo.getEnv()].flrExplorerApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].flrExplorerBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }
}
