import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { coins, HbarTokenConfig, tokens } from '@bitgo/statics';
import { Hbar } from './hbar';

export class HbarToken extends Hbar {
  public readonly tokenConfig: HbarTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: HbarTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('hbar') : coins.get('thbar');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: HbarTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new HbarToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.hbar.tokens, ...tokens.testnet.hbar.tokens]) {
      const tokenConstructor = HbarToken.createTokenConstructor(token);
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
    return this.name;
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
