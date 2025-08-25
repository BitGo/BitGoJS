import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CosmosTokenConfig, coins, tokens } from '@bitgo/statics';
import { Hash } from './hash';
import { HashUtils } from './lib/utils';

export class HashToken extends Hash {
  public readonly tokenConfig: CosmosTokenConfig;
  protected readonly _utils: HashUtils;

  constructor(bitgo: BitGoBase, tokenConfig: CosmosTokenConfig) {
    const staticsCoin = coins.get(tokenConfig.coin);
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
    this._utils = new HashUtils(staticsCoin.network.type);
  }

  static createTokenConstructor(config: CosmosTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new HashToken(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: CosmosTokenConfig[] = [...tokens.bitcoin.cosmos.tokens, ...tokens.testnet.cosmos.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      if (token.coin === 'hash' || token.coin === 'thash') {
        const tokenConstructor = HashToken.createTokenConstructor(token);
        tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
      }
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
    return 'Hash Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
