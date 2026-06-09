import { coins, XrpMptTokenConfig, tokens } from '@bitgo/statics';
import { Xrp } from './xrp';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';

export class XrpMptToken extends Xrp {
  public readonly tokenConfig: XrpMptTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: XrpMptTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('xrp') : coins.get('txrp');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: XrpMptTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new XrpMptToken(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: XrpMptTokenConfig[] = [...tokens.bitcoin.xrp.mptTokens, ...tokens.testnet.xrp.mptTokens]
  ): NamedCoinConstructor[] {
    return tokenConfigs.map((config) => ({
      name: config.type,
      coinConstructor: XrpMptToken.createTokenConstructor(config),
    }));
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

  get canTransfer(): boolean {
    return this.tokenConfig.canTransfer;
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
    return 'XRP MPT Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }
}
