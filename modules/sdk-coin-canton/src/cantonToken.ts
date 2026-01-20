import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { coins, CantonTokenConfig, NetworkType, tokens } from '@bitgo/statics';

import { Canton } from './canton';

export class CantonToken extends Canton {
  public readonly tokenConfig: CantonTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: CantonTokenConfig) {
    const staticsCoin = tokenConfig.network === NetworkType.MAINNET ? coins.get('canton') : coins.get('tcanton');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: CantonTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new CantonToken(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfig: CantonTokenConfig[] = [...tokens.bitcoin.canton.tokens, ...tokens.testnet.canton.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfig) {
      const tokenConstructor = CantonToken.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
  }

  get name(): string {
    return this.tokenConfig.name;
  }

  get coin(): string {
    return this.tokenConfig.coin;
  }

  get baseUrl(): string {
    return this.tokenConfig.baseUrl;
  }

  get admin(): string {
    return this.tokenConfig.admin;
  }

  get assetName(): string {
    return this.tokenConfig.assetName;
  }

  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  getChain(): string {
    return this.tokenConfig.type;
  }

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Canton Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
