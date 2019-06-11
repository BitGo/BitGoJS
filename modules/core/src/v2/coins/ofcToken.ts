import { CoinConstructor } from '../coinFactory';
import { Ofc } from './ofc';

interface OfcTokenConfig {
  type: string,
  coin: string,
  decimalPlaces: number,
  name: string,
  backingCoin: string,
  isFiat: boolean,
}

export class OfcToken extends Ofc {
  public readonly tokenConfig: OfcTokenConfig;

  constructor(bitgo, tokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;
  }

  get coin() {
    return this.tokenConfig.coin;
  }

  get decimalPlaces() {
    return this.tokenConfig.decimalPlaces;
  }

  get name() {
    return this.tokenConfig.name;
  }

  get backingCoin() {
    return this.tokenConfig.backingCoin;
  }

  get isFiat() {
    return this.tokenConfig.isFiat;
  }

  getChain() {
    return this.type;
  }

  getFullName() {
    return this.name;
  }

  getBaseFactor() {
    return String(Math.pow(10, this.decimalPlaces));
  }

  public get type() {
    return this.tokenConfig.type;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed() {
    return false;
  }

  static createTokenConstructor(config): CoinConstructor {
    return (bitgo: any) => new OfcToken(bitgo, config);
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * - txPrebuild
   * - prv
   * @returns {{txHex}}
   */
  signTransaction(params) {
    const txPrebuild = params.txPrebuild;
    const payload = txPrebuild.payload;
    const signatureBuffer = this.signMessage(params, payload);
    const signature = signatureBuffer.toString('hex');
    return { halfSigned: { payload, signature } };
  }
}
