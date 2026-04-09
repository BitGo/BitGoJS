import { Apt } from './apt';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { AptTokenConfig, coins, tokens } from '@bitgo/statics';

export class AptToken extends Apt {
  public readonly tokenConfig: AptTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: AptTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('apt') : coins.get('tapt');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: AptTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new AptToken(bitgo, config);
  }
  static createTokenConstructors(
    tokenConfigs: AptTokenConfig[] = [...tokens.bitcoin.apt.tokens, ...tokens.testnet.apt.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      const tokenConstructor = AptToken.createTokenConstructor(token);
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
    return 'Apt Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
