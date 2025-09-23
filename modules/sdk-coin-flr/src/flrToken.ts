import { coins, EthLikeTokenConfig } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, common, MPCAlgorithm, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CoinNames, EthLikeToken, recoveryBlockchainExplorerQuery } from '@bitgo/abstract-eth';

import { TransactionBuilder } from './lib';

export { EthLikeTokenConfig };

export class FlrToken extends EthLikeToken {
  public readonly tokenConfig: EthLikeTokenConfig;
  static coinNames: CoinNames = {
    Mainnet: 'flr',
    Testnet: 'tflr',
  };
  constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig) {
    super(bitgo, tokenConfig, FlrToken.coinNames);
  }
  static createTokenConstructor(config: EthLikeTokenConfig): CoinConstructor {
    return super.createTokenConstructor(config, FlrToken.coinNames);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    return super.createTokenConstructors(FlrToken.coinNames);
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc **/
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /**
   * Make a query to Flare explorer for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @param {string} apiKey optional API key to use instead of the one from the environment
   * @returns {Promise<Object>} response from Flare explorer
   */
  async recoveryBlockchainExplorerQuery(
    query: Record<string, string>,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    const apiToken = apiKey || common.Environments[this.bitgo.getEnv()].flrExplorerApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].flrExplorerBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }

  getFullName(): string {
    return 'Flare Token';
  }
}
