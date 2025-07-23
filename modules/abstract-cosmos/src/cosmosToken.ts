import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CosmosTokenConfig, coins, tokens } from '@bitgo/statics';
import { CosmosCoin } from './cosmosCoin';

export class CosmosToken extends CosmosCoin {
  public readonly tokenConfig: CosmosTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: CosmosTokenConfig) {
    const staticsCoin = coins.get(tokenConfig.coin);
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: CosmosTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new CosmosToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.cosmos.tokens, ...tokens.testnet.cosmos.tokens]) {
      const tokenConstructor = CosmosToken.createTokenConstructor(token);
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

  get denom(): string {
    return this.tokenConfig.denom;
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
    // Eg - returns "Atom Token", "Osmo Token"
    return `${this.tokenConfig.coin.charAt(0).toUpperCase()}${this.tokenConfig.coin.slice(1)} Token`;
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
