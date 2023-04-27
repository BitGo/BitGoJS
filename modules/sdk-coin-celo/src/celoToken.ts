/**
 * @prettier
 */
import { Celo } from './celo';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { CeloTokenConfig, tokens } from '@bitgo/statics';

export { CeloTokenConfig };

export class CeloToken extends Celo {
  public readonly tokenConfig: CeloTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: CeloTokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: CeloTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new CeloToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.celo.tokens, ...tokens.testnet.celo.tokens]) {
      const tokenConstructor = CeloToken.createTokenConstructor(token);
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
    return 'Celo Token';
  }

  getBaseFactor(): number {
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
