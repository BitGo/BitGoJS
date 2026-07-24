/**
 * @prettier
 */
import { coins, EthLikeTokenConfig } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, common, MPCAlgorithm, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CoinNames, EthLikeToken, recoveryBlockchainExplorerQuery } from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';
import assert from 'assert';

export class EthLikeErc20Token extends EthLikeToken {
  public readonly tokenConfig: EthLikeTokenConfig;
  private readonly coinNames: CoinNames;

  constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig, coinNames: CoinNames) {
    super(bitgo, tokenConfig, coinNames);
    this.coinNames = coinNames;
  }

  static createTokenConstructor(config: EthLikeTokenConfig, coinNames: CoinNames): CoinConstructor {
    return (bitgo: BitGoBase) => new this(bitgo, config, coinNames);
  }

  static createTokenConstructors(coinNames: CoinNames): NamedCoinConstructor[] {
    return super.createTokenConstructors(coinNames);
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  supportsTss(): boolean {
    return true;
  }

  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const family = this.getFamily();
    const evmConfig = common.Environments[this.bitgo.getEnv()].evm;
    assert(
      evmConfig && this.getFamily() in evmConfig,
      `env config is missing for ${this.getFamily()} in ${this.bitgo.getEnv()}`
    );
    const explorerUrl = evmConfig[family].baseUrl;
    const apiToken = evmConfig[family].apiToken;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }

  //TODO: implement a way to return the coin family name or coin name instead of standard ERC20 Token.
  getFullName(): string {
    return 'ERC20 Token';
  }
}
