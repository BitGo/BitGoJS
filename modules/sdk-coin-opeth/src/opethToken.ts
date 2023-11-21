/**
 * @prettier
 */
import { EthLikeTokenConfig, coins } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CoinNames, EthLikeToken } from '@bitgo/abstract-eth';

import { TransactionBuilder } from './lib';
export { EthLikeTokenConfig };

export class OpethToken extends EthLikeToken {
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

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  getFullName(): string {
    return 'Opeth Token';
  }
}
