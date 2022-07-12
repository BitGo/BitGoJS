import { Sol } from './sol';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { coins, tokens } from '@bitgo/statics';

export interface SolTokenConfig {
  name: string;
  type: string;
  coin: string;
  network: string;
  tokenAddress: string;
  decimalPlaces: number;
}

export class SolToken extends Sol {
  public readonly tokenConfig: SolTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: SolTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('sol') : coins.get('tsol');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: SolTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new SolToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.sol.tokens, ...tokens.testnet.sol.tokens]) {
      const tokenConstructor = SolToken.createTokenConstructor(token);
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

  get tokenAddress() {
    return this.tokenConfig.tokenAddress;
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
    return 'Solana Token';
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
