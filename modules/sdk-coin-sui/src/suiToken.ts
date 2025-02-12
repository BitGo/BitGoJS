import { coins, SuiTokenConfig, tokens } from '@bitgo/statics';
import { Sui } from './sui';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';

export class SuiToken extends Sui {
  public readonly tokenConfig: SuiTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: SuiTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('sui') : coins.get('tsui');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: SuiTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new SuiToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.sui.tokens, ...tokens.testnet.sui.tokens]) {
      const tokenConstructor = SuiToken.createTokenConstructor(token);
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

  get packageId(): string {
    return this.tokenConfig.packageId;
  }

  get module(): string {
    return this.tokenConfig.module;
  }

  get symbol(): string {
    return this.tokenConfig.symbol;
  }

  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  get contractAddress(): string {
    return this.tokenConfig.contractAddress;
  }

  getChain(): string {
    return this.tokenConfig.type;
  }

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Sui Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
