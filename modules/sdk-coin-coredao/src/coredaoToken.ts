/**
 * @prettier
 */
import { coins, EthLikeTokenConfig } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, common, MPCAlgorithm, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CoinNames, EthLikeToken, recoveryBlockchainExplorerQuery } from '@bitgo/abstract-eth';

import { TransactionBuilder } from './lib';

export { EthLikeTokenConfig };

export class CoredaoToken extends EthLikeToken {
  public readonly tokenConfig: EthLikeTokenConfig;
  static coinNames: CoinNames = {
    Mainnet: 'coredao',
    Testnet: 'tcoredao',
  };
  constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig) {
    super(bitgo, tokenConfig, CoredaoToken.coinNames);
  }
  static createTokenConstructor(config: EthLikeTokenConfig): CoinConstructor {
    return super.createTokenConstructor(config, CoredaoToken.coinNames);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    return super.createTokenConstructors(CoredaoToken.coinNames);
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
   * Make a query to Coredao explorer for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response Coredao explorer
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const apiToken = common.Environments[this.bitgo.getEnv()].coredaoExplorerApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].coredaoExplorerBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }

  getFullName(): string {
    return 'Coredao Token';
  }
}
