import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { coins, Nep141TokenConfig, NetworkType, tokens } from '@bitgo/statics';

import { Near } from './near';

export class Nep141Token extends Near {
  public readonly tokenConfig: Nep141TokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: Nep141TokenConfig) {
    const staticsCoin = tokenConfig.network === NetworkType.MAINNET ? coins.get('near') : coins.get('tnear');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: Nep141TokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new Nep141Token(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfig: Nep141TokenConfig[] = [...tokens.bitcoin.near.tokens, ...tokens.testnet.near.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfig) {
      const tokenConstructor = Nep141Token.createTokenConstructor(token);
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

  get contractAddress(): string {
    return this.tokenConfig.contractAddress;
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
    return 'Nep141 Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
