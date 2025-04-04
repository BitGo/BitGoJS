/**
 * @prettier
 */
import { AbstractEthLikeNewCoins, recoveryBlockchainExplorerQuery } from '@bitgo/abstract-eth';
import { BaseCoin, BitGoBase, common, MPCAlgorithm, MultisigType, multisigTypes } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { TransactionBuilder } from './lib';
import {
  UnsignedSweepTxMPCv2,
  RecoverOptions,
  OfflineVaultTxInfo,
} from '../../abstract-eth/src/abstractEthLikeNewCoins';

export class Polygon extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  /**
   * Builds an unsigned sweep transaction for TSS
   * @param params - Recovery options
   * @returns {Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2>}
   */
  protected async buildUnsignedSweepTxnTSS(params: RecoverOptions): Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    return this.buildUnsignedSweepTxnMPCv2(params);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Polygon(bitgo, staticsCoin);
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /**
   * Make a query to Polygon explorer for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from Polygon
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const apiToken = common.Environments[this.bitgo.getEnv()].polygonscanApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].polygonscanBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
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

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }
}
