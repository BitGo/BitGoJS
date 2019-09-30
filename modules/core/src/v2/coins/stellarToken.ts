/**
 * @prettier
 */
import * as _ from 'lodash';
import { BitGo } from '../../bitgo';
import { Xlm } from './xlm';
import { CoinConstructor } from '../coinFactory';
import { BitGoJsError } from '../../errors';
import * as stellar from 'stellar-sdk';

export interface StellarTokenConfig {
  name: string;
  type: string;
  coin: string;
  network: string;
  decimalPlaces: number;
}

export class StellarToken extends Xlm {
  static readonly tokenPattern: RegExp = /[A-Z]{1,12}-G[A-Z0-9]{55}/;
  public readonly tokenConfig: StellarTokenConfig;
  private readonly _code: string;
  private readonly _issuer: string;

  constructor(bitgo: BitGo, tokenConfig: StellarTokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;
    const network = this.tokenConfig.network === 'Testnet' ? stellar.Networks.TESTNET : stellar.Networks.PUBLIC;
    stellar.Network.use(new stellar.Network(network));

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
    return (bitgo: BitGo) => new StellarToken(bitgo, config);
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
