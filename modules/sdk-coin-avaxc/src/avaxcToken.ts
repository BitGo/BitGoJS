/**
 * @prettier
 */
import { AvaxC, TransactionPrebuild } from './avaxc';
import { BitGoBase, CoinConstructor } from '@bitgo/sdk-core';
import { AvaxcTokenConfig, coins } from '@bitgo/statics';

export { AvaxcTokenConfig };

export class AvaxCToken extends AvaxC {
  public readonly tokenConfig: AvaxcTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: AvaxcTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('avaxc') : coins.get('tavaxc');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: AvaxcTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new AvaxCToken(bitgo, config);
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

  getBaseChain() {
    return this.coin;
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

  isToken(): boolean {
    return true;
  }

  verifyCoin(txPrebuild: TransactionPrebuild): boolean {
    return txPrebuild.coin === this.tokenConfig.coin && txPrebuild.token === this.tokenConfig.type;
  }
}
