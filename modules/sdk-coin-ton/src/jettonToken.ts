import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo-beta/sdk-core';
import { JettonTokenConfig, coins, tokens } from '@bitgo-beta/statics';
import { Ton } from './ton';

export class JettonToken extends Ton {
  public readonly tokenConfig: JettonTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: JettonTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('ton') : coins.get('tton');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: JettonTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new JettonToken(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfig: JettonTokenConfig[] = [...tokens.bitcoin.ton.tokens, ...tokens.testnet.ton.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfig) {
      const tokenConstructor = JettonToken.createTokenConstructor(token);
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
    return 'Ton Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
