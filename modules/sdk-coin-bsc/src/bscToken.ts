/**
 * @prettier
 */

import { EthLikeTokenConfig } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CoinNames, EthLikeMPCToken } from '@bitgo/abstract-eth';

export { EthLikeTokenConfig };

export class BscToken extends EthLikeMPCToken {
  public readonly tokenConfig: EthLikeTokenConfig;
  static coinNames: CoinNames = {
    Mainnet: 'bsc',
    Testnet: 'tbsc',
  };
  constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig) {
    super(bitgo, tokenConfig, BscToken.coinNames);
  }
  static createTokenConstructor(config: EthLikeTokenConfig): CoinConstructor {
    return super.createTokenConstructor(config, BscToken.coinNames);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    return super.createTokenConstructors(BscToken.coinNames);
  }

  getFullName(): string {
    return 'Bsc Token';
  }
}
