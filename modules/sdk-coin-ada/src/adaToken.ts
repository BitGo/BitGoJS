import { Ada } from './ada';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { coins, tokens, AdaTokenConfig } from '@bitgo/statics';

export class AdaToken extends Ada {
  public readonly tokenConfig: AdaTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: AdaTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('ada') : coins.get('tada');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: AdaTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new AdaToken(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: AdaTokenConfig[] = [...tokens.bitcoin.ada.tokens, ...tokens.testnet.ada.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      const tokenConstructor = AdaToken.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
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

  get policyId() {
    return this.tokenConfig.policyId;
  }

  get assetName() {
    return this.tokenConfig.assetName;
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
    return 'Cardano Token';
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

  get contractAddress() {
    return this.tokenConfig.contractAddress;
  }
}
