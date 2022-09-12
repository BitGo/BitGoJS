/**
 * @prettier
 */
import { coins, EthLikeTokenConfig, tokens } from '@bitgo/statics';

import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { AbstractEthLikeCoin } from './abstractEthLikeCoin';
import { TransactionBuilder as EthTransactionBuilder, TransactionPrebuild } from '@bitgo/sdk-coin-eth';

export type CoinNames = {
  [network: string]: string;
};

export class EthLikeToken extends AbstractEthLikeCoin {
  public readonly tokenConfig: EthLikeTokenConfig;

  protected constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig, coinNames: CoinNames) {
    const staticsCoin = coins.get(coinNames[tokenConfig.network]);
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: EthLikeTokenConfig, coinNames: CoinNames): CoinConstructor {
    return (bitgo: BitGoBase) => new this(bitgo, config, coinNames);
  }

  static createTokenConstructors(coinNames: CoinNames): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    const chain = coinNames.Mainnet;
    for (const token of [...tokens.bitcoin[chain].tokens, ...tokens.testnet[chain].tokens]) {
      const tokenConstructor = this.createTokenConstructor(token, coinNames);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
      tokensCtors.push({ name: token.tokenContractAddress, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
  }

  protected getTransactionBuilder(): EthTransactionBuilder {
    return new EthTransactionBuilder(coins.get(this.getBaseChain()));
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

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Eth Like Token';
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
