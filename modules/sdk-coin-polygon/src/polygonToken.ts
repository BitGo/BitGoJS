/**
 * @prettier
 */

import { Polygon } from './polygon';
import { TransactionPrebuild } from '@bitgo/sdk-coin-eth';
import { EthLikeTokenConfig, tokens } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';

export { EthLikeTokenConfig };

export class PolygonToken extends Polygon {
  public readonly tokenConfig: EthLikeTokenConfig;
  constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: EthLikeTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new PolygonToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.polygon.tokens, ...tokens.testnet.polygon.tokens]) {
      const tokenConstructor = PolygonToken.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
      tokensCtors.push({ name: token.tokenContractAddress, coinConstructor: tokenConstructor });
    }
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

  get tokenContractAddress(): string {
    return this.tokenConfig.tokenContractAddress;
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
    return this._staticsCoin.fullName;
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
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
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
