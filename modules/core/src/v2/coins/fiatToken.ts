/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { Fiat } from './fiat';
import { CoinConstructor } from '../coinFactory';

export interface FiatTokenConfig {
  name: string;
  type: string;
  coin: string;
  network: string;
  decimalPlaces: number;
}

export class FiatToken extends Fiat {
  public readonly tokenConfig: FiatTokenConfig;

  constructor(bitgo: BitGo, tokenConfig: FiatTokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: FiatTokenConfig): CoinConstructor {
    return (bitgo: BitGo) => new FiatToken(bitgo, config);
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
    return 'FIAT Token';
  }

  getBaseFactor() {
    return 1e2;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed() {
    return false;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (CELO), false otherwise
   */
  transactionDataAllowed() {
    return false;
  }
}
