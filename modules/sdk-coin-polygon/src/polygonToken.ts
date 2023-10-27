/**
 * @prettier
 */
import { EthLikeToken, CoinNames } from '@bitgo/abstract-eth';
import { EthLikeTokenConfig } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';

export { EthLikeTokenConfig };

export class PolygonToken extends EthLikeToken {
  public readonly tokenConfig: EthLikeTokenConfig;
  static coinNames: CoinNames = {
    Mainnet: 'polygon',
    Testnet: 'tpolygon',
  };
  constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig) {
    super(bitgo, tokenConfig, PolygonToken.coinNames);
  }

  static createTokenConstructor(config: EthLikeTokenConfig): CoinConstructor {
    return super.createTokenConstructor(config, PolygonToken.coinNames);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    return super.createTokenConstructors(PolygonToken.coinNames);
  }

  getFullName(): string {
    return 'Polygon Token';
  }
}
