import { coins, EthLikeTokenConfig } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, MPCAlgorithm, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CoinNames, EthLikeToken } from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';
import * as utils from './lib/utils';

export { EthLikeTokenConfig };

export class SoneiumToken extends EthLikeToken {
  public readonly tokenConfig: EthLikeTokenConfig;
  static coinNames: CoinNames = {
    Mainnet: 'soneium',
    Testnet: 'tsoneium',
  };

  constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig) {
    super(bitgo, tokenConfig, SoneiumToken.coinNames);
  }

  static createTokenConstructor(config: EthLikeTokenConfig): CoinConstructor {
    return super.createTokenConstructor(config, SoneiumToken.coinNames);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    return super.createTokenConstructors(SoneiumToken.coinNames);
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
   * Make a query to soneium.network for information such as balance, token balance, solidity calls
   * @param {Object} query — key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from soneium.network
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, any>): Promise<any> {
    return await utils.recoveryBlockchainExplorerQuery(query, this.bitgo.getEnv());
  }

  getFullName(): string {
    return 'Soneium Token';
  }
}
