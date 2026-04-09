import { coins, PolyxTokenConfig, tokens } from '@bitgo/statics';
import { Polyx } from './polyx';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';

export class PolyxToken extends Polyx {
  public readonly tokenConfig: PolyxTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: PolyxTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('polyx') : coins.get('tpolyx');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: PolyxTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new PolyxToken(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: PolyxTokenConfig[] = [...tokens.bitcoin.polyx.tokens, ...tokens.testnet.polyx.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      const tokenConstructor = PolyxToken.createTokenConstructor(token);
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

  get network(): string {
    return this.tokenConfig.network;
  }

  get ticker(): string {
    return this.tokenConfig.ticker;
  }

  get assetId(): string {
    return this.tokenConfig.assetId;
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
    return this._staticsCoin.fullName;
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
