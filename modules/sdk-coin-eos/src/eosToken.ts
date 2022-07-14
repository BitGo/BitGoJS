/**
 * @prettier
 */
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { EosTokenConfig, tokens } from '@bitgo/statics';
import { Eos } from './eos';

export { EosTokenConfig };

export class EosToken extends Eos {
  public readonly tokenConfig: EosTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: EosTokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: EosTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new EosToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.eos.tokens, ...tokens.testnet.eos.tokens]) {
      const tokenConstructor = EosToken.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
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
