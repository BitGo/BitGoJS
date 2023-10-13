/**
 * @prettier
 */
import { EthLikeTokenConfig } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CoinNames, EthLikeMPCToken } from '@bitgo/abstract-eth';

export { EthLikeTokenConfig };

export class ArbethToken extends EthLikeMPCToken {
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

  getFullName(): string {
    return 'Arbeth Token';
  }
}
