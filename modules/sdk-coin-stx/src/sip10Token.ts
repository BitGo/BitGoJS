import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { coins, NetworkType, Sip10TokenConfig, tokens } from '@bitgo/statics';
import { Stx } from './stx';

export class Sip10Token extends Stx {
  public readonly tokenConfig: Sip10TokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: Sip10TokenConfig) {
    const staticsCoin = tokenConfig.network === NetworkType.MAINNET ? coins.get('stx') : coins.get('tstx');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: Sip10TokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new Sip10Token(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.stx.tokens, ...tokens.testnet.stx.tokens]) {
      const tokenConstructor = Sip10Token.createTokenConstructor(token);
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

  get tokenContractAddress(): string {
    return this.tokenConfig.tokenContractAddress;
  }

  get contractName(): string {
    return this.tokenConfig.contractName;
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
    return 'Sip10 Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
