/**
 * @prettier
 */
import { BitGo } from '../../bitgo';

import { Eos } from './eos';
import { CoinConstructor } from '../coinFactory';

export interface EosTokenConfig {
  name: string;
  type: string;
  coin: string;
  network: string;
  tokenContractAddress: string;
  decimalPlaces: number;
}

export class EosToken extends Eos {
  public readonly tokenConfig: EosTokenConfig;

  constructor(bitgo: BitGo, tokenConfig: EosTokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: EosTokenConfig): CoinConstructor {
    return (bitgo: BitGo) => new EosToken(bitgo, config);
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

  get tokenContractAddress() {
    return this.tokenConfig.tokenContractAddress;
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
    return 'EOS Token';
  }

  getBaseFactor() {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
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
