/**
 * @prettier
 */
import { BitGo } from '../../bitgo';

import { Celo } from './celo';
import { CoinConstructor } from '../coinFactory';
import { coins } from '@bitgo/statics';

export interface CeloTokenConfig {
  name: string;
  type: string;
  coin: string;
  network: string;
  tokenContractAddress: string;
  decimalPlaces: number;
}

export class CeloToken extends Celo {
  public readonly tokenConfig: CeloTokenConfig;

  constructor(bitgo: BitGo, tokenConfig: CeloTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('celo') : coins.get('tcelo');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: CeloTokenConfig): CoinConstructor {
    return (bitgo: BitGo) => new CeloToken(bitgo, config);
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
    return 'Celo Token';
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
