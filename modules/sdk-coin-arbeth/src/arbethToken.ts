/**
 * @prettier
 */
import { EthLikeTokenConfig, coins } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CoinNames, EthLikeToken } from '@bitgo/abstract-eth';

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

  getFullName(): string {
    return 'Arbeth Token';
  }
}
