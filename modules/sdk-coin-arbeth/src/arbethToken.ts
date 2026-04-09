/**
 * @prettier
 */
import { EthLikeTokenConfig, coins } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, NamedCoinConstructor, common, MPCAlgorithm } from '@bitgo/sdk-core';
import { CoinNames, EthLikeToken, recoveryBlockchainExplorerQuery } from '@bitgo/abstract-eth';

import { TransactionBuilder } from './lib';
export { EthLikeTokenConfig };

export class ArbethToken extends EthLikeToken {
  public readonly tokenConfig: EthLikeTokenConfig;
  static coinNames: CoinNames = {
    Mainnet: 'arbeth',
    Testnet: 'tarbeth',
  };
  constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig) {
    super(bitgo, tokenConfig, ArbethToken.coinNames);
  }
  static createTokenConstructor(config: EthLikeTokenConfig): CoinConstructor {
    return super.createTokenConstructor(config, ArbethToken.coinNames);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    return super.createTokenConstructors(ArbethToken.coinNames);
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /**
   * Make a query to Arbiscan for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from Arbiscan
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const apiToken = common.Environments[this.bitgo.getEnv()].arbiscanApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].arbiscanBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }

  getFullName(): string {
    return 'Arbeth Token';
  }

  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }
}
