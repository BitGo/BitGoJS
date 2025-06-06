/**
 * @prettier
 */
import { BaseCoin, BitGoBase, common, MPCAlgorithm, MultisigType, multisigTypes } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFeature, coins } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  OfflineVaultTxInfo,
  RecoverOptions,
  recoveryBlockchainExplorerQuery,
  TransactionBuilder as EthLikeTransactionBuilder,
  UnsignedSweepTxMPCv2,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';
import assert from 'assert';

export class EvmCoin extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new EvmCoin(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): EthLikeTransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return this.staticsCoin?.features.includes(CoinFeature.TSS) ?? false;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return this.staticsCoin?.features.includes(CoinFeature.TSS) ? multisigTypes.tss : multisigTypes.onchain;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  protected async buildUnsignedSweepTxnTSS(params: RecoverOptions): Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    if (this.staticsCoin?.features.includes(CoinFeature.MPCV2)) {
      return this.buildUnsignedSweepTxnMPCv2(params);
    }
    return super.buildUnsignedSweepTxnTSS(params);
  }

  /**
   * Make a query to chain explorer for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from chain explorer
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const evmConfig = common.Environments[this.bitgo.getEnv()].evm;
    assert(
      evmConfig && this.getFamily() in evmConfig,
      `env config is missing for ${this.getFamily()} in ${this.bitgo.getEnv()}`
    );

    const apiToken = evmConfig[this.getFamily()].apiToken;
    const explorerUrl = evmConfig[this.getFamily()].baseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken as string);
  }
}
