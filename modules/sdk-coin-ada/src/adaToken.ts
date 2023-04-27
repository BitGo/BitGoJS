import { Ada } from './ada';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { AdaTokenConfig, tokens } from '@bitgo/statics';

export class AdaToken extends Ada {
  public readonly tokenConfig: AdaTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: AdaTokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: AdaTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new AdaToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.ada.tokens, ...tokens.testnet.ada.tokens]) {
      const tokenConstructor = AdaToken.createTokenConstructor(token);
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

  get policyId(): string {
    return this.tokenConfig.policyId;
  }

  get assetName(): string {
    return this.tokenConfig.assetName;
  }

  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  getId(): string {
    return this.tokenConfig.id;
  }

  getChain(): string {
    return this.tokenConfig.type;
  }

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Cardano Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (CELO), false otherwise
   */
  transactionDataAllowed(): boolean {
    return false;
  }
}
