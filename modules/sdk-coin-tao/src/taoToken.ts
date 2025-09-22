import { coins, TaoTokenConfig, tokens } from '@bitgo-beta/statics';
import { Tao } from './tao';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo-beta/sdk-core';

export class TaoToken extends Tao {
  public readonly tokenConfig: TaoTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: TaoTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('tao') : coins.get('ttao');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: TaoTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new TaoToken(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: TaoTokenConfig[] = [...tokens.bitcoin.tao.tokens, ...tokens.testnet.tao.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      const tokenConstructor = TaoToken.createTokenConstructor(token);
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

  get subnetId(): string {
    return this.tokenConfig.subnetId;
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
