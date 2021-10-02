/**
 * @prettier
 */
import * as _ from 'lodash';
import { BitGo } from '../../bitgo';
import { Algo } from './algo';
import { CoinConstructor } from '../coinFactory';
import { BitGoJsError } from '../../errors';

export interface AlgoTokenConfig {
  name: string;
  type: string;
  coin: string;
  network: string;
  decimalPlaces: number;
}

export class AlgoToken extends Algo {
  static readonly tokenPattern: RegExp = /[0-9]/;
  public readonly tokenConfig: AlgoTokenConfig;
  private readonly _code: string;
  private readonly _issuer: string;

  constructor(bitgo: BitGo, tokenConfig: AlgoTokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;

    const [tokenCoin, token] = _.split(this.tokenConfig.type, Algo.coinTokenPatternSeparator);
    if (tokenCoin !== tokenConfig.coin) {
      throw new BitGoJsError(`invalid coin found in token: ${this.tokenConfig.type}`);
    }
    if (!token || !token.match(AlgoToken.tokenPattern)) {
      throw new BitGoJsError(`invalid token: ${this.tokenConfig.type}`);
    }
    [this._code, this._issuer] = _.split(token, '-');
  }

  static createTokenConstructor(config: AlgoTokenConfig): CoinConstructor {
    return (bitgo: BitGo) => new AlgoToken(bitgo, config);
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

  getBaseChain() {
    return this.coin;
  }

  getFullName() {
    return 'Algo Token';
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed() {
    return true;
  }
}
