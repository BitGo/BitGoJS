/**
 * @prettier
 */
import { BitGo } from '../../bitgo';

import { AvaxC } from './avaxc';
import { CoinConstructor } from '../coinFactory';
import { coins } from '@bitgo/statics';

export interface AvaxcTokenConfig {
  name: string;
  type: string;
  coin: string;
  network: string;
  tokenContractAddress: string;
  decimalPlaces: number;
}

export class AvaxCToken extends AvaxC {
  public readonly tokenConfig: AvaxcTokenConfig;

  constructor(bitgo: BitGo, tokenConfig: AvaxcTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('avaxc') : coins.get('tavaxc');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: AvaxcTokenConfig): CoinConstructor {
    return (bitgo: BitGo) => new AvaxCToken(bitgo, config);
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

  get tokenContractAddress(): string {
    return this.tokenConfig.tokenContractAddress;
  }

  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  getChain(): string {
    return this.tokenConfig.type;
  }

  getFullName(): string {
    return 'Avaxc Token';
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
   * @returns {boolean} True if okay to send tx data (AVAXC), false otherwise
   */
  transactionDataAllowed(): boolean {
    return false;
  }
}
