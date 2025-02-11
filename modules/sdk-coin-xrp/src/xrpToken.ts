import { coins, XrpTokenConfig, tokens } from '@bitgo/statics';
import { Xrp } from './xrp';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';

export class XrpToken extends Xrp {
  public readonly tokenConfig: XrpTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: XrpTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('xrp') : coins.get('txrp');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: XrpTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new XrpToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.xrp.tokens, ...tokens.testnet.xrp.tokens]) {
      const tokenConstructor = XrpToken.createTokenConstructor(token);
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

  get issuerAddress(): string {
    return this.tokenConfig.issuerAddress;
  }

  get currencyCode(): string {
    return this.tokenConfig.currencyCode;
  }

  get contractAddress(): string {
    return this.tokenConfig.contractAddress;
  }

  get domain(): string {
    return this.tokenConfig.domain || '';
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
    return 'Xrp Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
