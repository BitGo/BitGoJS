/**
 * @prettier
 */
import { EthLikeTokenConfig, coins } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, NamedCoinConstructor, common } from '@bitgo/sdk-core';
import { CoinNames, EthLikeToken, recoveryBlockchainExplorerQuery } from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';

export { EthLikeTokenConfig };

export class ZkethToken extends EthLikeToken {
  public readonly tokenConfig: EthLikeTokenConfig;
  static coinNames: CoinNames = {
    Mainnet: 'zketh',
    Testnet: 'tzketh',
  };
  constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig) {
    super(bitgo, tokenConfig, ZkethToken.coinNames);
  }
  static createTokenConstructor(config: EthLikeTokenConfig): CoinConstructor {
    return super.createTokenConstructor(config, ZkethToken.coinNames);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    return super.createTokenConstructors(ZkethToken.coinNames);
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /**
   * Make a query to Zksync explorer for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from Zksync explorer
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const explorerUrl = common.Environments[this.bitgo.getEnv()].zksyncExplorerBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string);
  }

  getFullName(): string {
    return 'Zketh Token';
  }
}
