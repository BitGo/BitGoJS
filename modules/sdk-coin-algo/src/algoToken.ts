/**
 * @prettier
 */
import { Algo } from './algo';
import { BitGoBase, BitGoJsError, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { AlgoTokenConfig, formattedAlgoTokens } from '@bitgo/statics';

export class AlgoToken extends Algo {
  static readonly tokenNamePattern = /^([^:]+):(?:([^.]+)-)?([0-9]+)$/;
  static readonly tokenPattern: RegExp = /[0-9]/;
  public readonly tokenConfig: AlgoTokenConfig;
  private readonly _code: string;

  constructor(bitgo: BitGoBase, tokenConfig: AlgoTokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;

    const match = this.tokenConfig.type.match(AlgoToken.tokenNamePattern) || [];

    const tokenCoin = match[1];
    this._code = match[2];
    const token = match[3];

    if (tokenCoin !== tokenConfig.coin) {
      throw new BitGoJsError(`invalid coin found in token: ${this.tokenConfig.type}`);
    }
    if (!token) {
      throw new BitGoJsError(`invalid token: ${this.tokenConfig.type}`);
    }
  }

  static createTokenConstructor(config: AlgoTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new AlgoToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    formattedAlgoTokens.forEach((config) => {
      tokensCtors.push({ name: config.type, coinConstructor: AlgoToken.createTokenConstructor(config) });
      if (config.alias) {
        tokensCtors.push({ name: config.alias, coinConstructor: AlgoToken.createTokenConstructor(config) });
      }
    });
    return tokensCtors;
  }

  get type(): string {
    return this.tokenConfig.type;
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

  get code(): string {
    return this._code;
  }

  get issuer(): string | undefined {
    return undefined; // Not defined for Algorand
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
    return 'Algo Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }
}
