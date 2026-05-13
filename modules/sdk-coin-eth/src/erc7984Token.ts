/**
 * @prettier
 */
import { BitGoBase, CoinConstructor, MPCAlgorithm, NamedCoinConstructor } from '@bitgo/sdk-core';

import { coins, Erc7984TokenConfig, tokens } from '@bitgo/statics';
import { CoinNames } from '@bitgo/abstract-eth';

import { Eth } from './eth';
import { TransactionBuilder } from './lib';

export { Erc7984TokenConfig };

export class Erc7984Token extends Eth {
  public readonly tokenConfig: Erc7984TokenConfig;
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';
  static coinNames: CoinNames = {
    Mainnet: 'eth',
    Testnet: 'hteth',
  };

  constructor(bitgo: BitGoBase, tokenConfig: Erc7984TokenConfig) {
    const staticsCoin = coins.get(Erc7984Token.coinNames[tokenConfig.network]);
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
    this.sendMethodName = 'sendMultiSigToken';
  }

  static createTokenConstructor(config: Erc7984TokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new Erc7984Token(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: Erc7984TokenConfig[] = [
      ...tokens.bitcoin.eth.confidentialTokens,
      ...tokens.testnet.eth.confidentialTokens,
    ]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      const tokenConstructor = Erc7984Token.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
      tokensCtors.push({ name: token.tokenContractAddress, coinConstructor: tokenConstructor });
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

  get tokenContractAddress() {
    return this.tokenConfig.tokenContractAddress;
  }

  get decimalPlaces() {
    return this.tokenConfig.decimalPlaces;
  }

  getChain() {
    return this.tokenConfig.type;
  }

  getFullName() {
    return 'ERC7984 Confidential Token';
  }

  getBaseFactor() {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  /**
   * Flag for sending value of 0.
   * ERC-7984 confidential transfers always carry an encrypted amount; zero-value sends are not meaningful.
   */
  valuelessTransferAllowed() {
    return false;
  }

  /**
   * Flag for sending data along with transactions.
   */
  transactionDataAllowed() {
    return false;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }
}
