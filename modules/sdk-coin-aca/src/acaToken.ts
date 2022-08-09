import { Aca } from './aca';
import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { coins, tokens } from '@bitgo/statics';

export interface AcaTokenConfig {
  name: string;
  type: string;
  coin: string;
  network: string;
  tokenSymbol: string;
  decimalPlaces: number;
}

export class AcaToken extends Aca {
  public readonly tokenConfig: AcaTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: AcaTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('aca') : coins.get('taca');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: AcaTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new AcaToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.aca.tokens, ...tokens.testnet.aca.tokens]) {
      const tokenConstructor = AcaToken.createTokenConstructor(token);
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

  get tokenSymbol() {
    return this.tokenConfig.tokenSymbol;
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
    return 'Acala Token';
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
