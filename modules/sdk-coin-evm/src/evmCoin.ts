/**
 * @prettier
 */
import { BaseCoin, BitGoBase, common, MPCAlgorithm, MultisigType, multisigTypes } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFeature, coins, CoinFamily } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  OfflineVaultTxInfo,
  RecoverOptions,
  recoveryBlockchainExplorerQuery,
  TransactionBuilder as EthLikeTransactionBuilder,
  UnsignedSweepTxMPCv2,
  VerifyEthTransactionOptions,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';
import { recovery_HBAREVM_BlockchainExplorerQuery, validateHederaAccountId } from './lib/utils';
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

  /** @inheritDoc */
  supportsMessageSigning(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsSigningTypedData(): boolean {
    return true;
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
   * @param {string} apiKey optional API key to use for the query falls back to EVM config if not provided
   * @returns {Promise<Object>} response from chain explorer
   */
  async recoveryBlockchainExplorerQuery(
    query: Record<string, string>,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    const evmConfig = common.Environments[this.bitgo.getEnv()].evm;
    assert(
      evmConfig && this.getFamily() in evmConfig,
      `env config is missing for ${this.getFamily()} in ${this.bitgo.getEnv()}`
    );

    const apiToken = apiKey || evmConfig[this.getFamily()].apiToken;
    const explorerUrl = evmConfig[this.getFamily()].baseUrl;
    switch (this.getFamily()) {
      case CoinFamily.HBAREVM:
        assert(
          evmConfig[this.getFamily()].rpcUrl,
          `rpc url config is missing for ${this.getFamily()} in ${this.bitgo.getEnv()}`
        );
        const rpcUrl = evmConfig[this.getFamily()].rpcUrl;
        return await recovery_HBAREVM_BlockchainExplorerQuery(
          query,
          rpcUrl as string,
          explorerUrl as string,
          apiToken as string
        );
      default:
        return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken as string);
    }
  }

  /** @inheritDoc */
  async verifyTssTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const supportsEIP1559 = this.staticsCoin?.features?.includes(CoinFeature.EIP1559);
    if (supportsEIP1559) {
      return await super.verifyTssTransaction(params);
    } else {
      return await this.verifyLegacyTssTransaction(params);
    }
  }

  /**
   * Verifies legacy (non-EIP-1559) TSS transactions with basic validation.
   */
  private async verifyLegacyTssTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, wallet } = params;

    // Basic validation for legacy transactions only
    if (
      !txParams?.recipients &&
      !(
        txParams.prebuildTx?.consolidateId ||
        (txParams.type && ['acceleration', 'fillNonce', 'transferToken', 'tokenApproval'].includes(txParams.type))
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

    // If validation passes, consider it verified
    return true;
  }

  /** @inheritDoc */
  isValidAddress(address: string, isAlternateAddress?: boolean): boolean {
    if (isAlternateAddress && this.getFamily() === CoinFamily.HBAREVM) {
      const { valid } = validateHederaAccountId(address);
      return valid;
    }
    return super.isValidAddress(address);
  }
}
