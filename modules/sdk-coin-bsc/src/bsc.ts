import { BaseCoin, BitGoBase, common, MPCAlgorithm, MultisigType, multisigTypes } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  recoveryBlockchainExplorerQuery,
  VerifyEthTransactionOptions,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';

export class Bsc extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Bsc(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  allowsAccountConsolidations(): boolean {
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

  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const apiToken = common.Environments[this.bitgo.getEnv()].bscscanApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].bscscanBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }

  /**
   * Verify if a tss transaction is valid
   *
   * @param {VerifyEthTransactionOptions} params
   * @param {TransactionParams} params.txParams - params object passed to send
   * @param {TransactionPrebuild} params.txPrebuild - prebuild object returned by server
   * @param {Wallet} params.wallet - Wallet object to obtain keys to verify against
   * @returns {boolean}
   */
  async verifyTssTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, wallet } = params;
    if (
      !txParams?.recipients &&
      !(
        txParams.prebuildTx?.consolidateId ||
        (txParams.type && ['acceleration', 'fillNonce', 'transferToken'].includes(txParams.type))
      )
    ) {
      throw new Error(`missing txParams`);
    }
    if (!wallet || !txPrebuild) {
      throw new Error(`missing params`);
    }
    if (txParams.hop && txParams.recipients && txParams.recipients.length > 1) {
      throw new Error(`tx cannot be both a batch and hop transaction`);
    }

    return true;
  }
}
