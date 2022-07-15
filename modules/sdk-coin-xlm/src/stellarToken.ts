/**
 * @prettier
 */
import * as _ from 'lodash';
import { Xlm } from './xlm';
import { BitGoBase, BitGoJsError, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import * as stellar from 'stellar-sdk';
import { StellarTokenConfig, tokens } from '@bitgo/statics';

export { StellarTokenConfig };

export class StellarToken extends Xlm {
  static readonly tokenPattern: RegExp = /[A-Z]{1,12}-G[A-Z0-9]{55}/;
  public readonly tokenConfig: StellarTokenConfig;
  private readonly _code: string;
  private readonly _issuer: string;

  constructor(bitgo: BitGoBase, tokenConfig: StellarTokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;

    const [tokenCoin, token] = _.split(this.tokenConfig.type, Xlm.coinTokenPatternSeparator);
    if (tokenCoin !== tokenConfig.coin) {
      throw new BitGoJsError(`invalid coin found in token: ${this.tokenConfig.type}`);
    }
    if (!token || !token.match(StellarToken.tokenPattern)) {
      throw new BitGoJsError(`invalid token: ${this.tokenConfig.type}`);
    }
    [this._code, this._issuer] = _.split(token, '-');
  }

  static createTokenConstructor(config: StellarTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new StellarToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.xlm.tokens, ...tokens.testnet.xlm.tokens]) {
      const tokenConstructor = StellarToken.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
  }

  get type() {
    return this.tokenConfig.type;
  }

  get name() {
    return this.tokenConfig.name;
  }

  get coin() {
    return this.tokenConfig.coin;
  }

  get network() {
    return this.tokenConfig.network;
  }

  get code() {
    return this._code;
  }

  get issuer() {
    return this._issuer;
  }

  get decimalPlaces() {
    return this.tokenConfig.decimalPlaces;
  }

  protected getStellarNetwork(): stellar.Networks {
    return this.tokenConfig.network === 'Testnet' ? stellar.Networks.TESTNET : stellar.Networks.PUBLIC;
  }

  getChain() {
    return this.tokenConfig.type;
  }

  getFullName() {
    return 'Stellar Token';
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed() {
    return true;
  }
}
