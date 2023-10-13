/**
 * @prettier
 */
import { EthLikeTokenConfig } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CoinNames, EthLikeMPCToken } from '@bitgo/abstract-eth';

export { EthLikeTokenConfig };

export class OpethToken extends EthLikeMPCToken {
  public readonly tokenConfig: EthLikeTokenConfig;
  static coinNames: CoinNames = {
    Mainnet: 'opeth',
    Testnet: 'topeth',
  };
  constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig) {
    super(bitgo, tokenConfig, OpethToken.coinNames);
  }
  static createTokenConstructor(config: EthLikeTokenConfig): CoinConstructor {
    return super.createTokenConstructor(config, OpethToken.coinNames);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    return super.createTokenConstructors(OpethToken.coinNames);
  }

  getFullName(): string {
    return 'Opeth Token';
  }
}
