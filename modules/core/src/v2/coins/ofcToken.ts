/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { CoinConstructor } from '../coinFactory';
import { Ofc } from './ofc';
import { isString } from 'lodash';
import { SignTransactionOptions as BaseSignTransactionOptions } from '../baseCoin';

export interface OfcTokenConfig {
  type: string;
  coin: string;
  decimalPlaces: number;
  name: string;
  backingCoin: string;
  isFiat: boolean;
}

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: {
    payload: string;
  };
  prv: string;
}

const publicIdRegex = /^[a-f\d]{32}$/i;
export class OfcToken extends Ofc {
  public readonly tokenConfig: OfcTokenConfig;

  constructor(bitgo: BitGo, tokenConfig: OfcTokenConfig) {
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

  static createTokenConstructor(config: OfcTokenConfig): CoinConstructor {
    return (bitgo: BitGo) => new OfcToken(bitgo, config);
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   */
  signTransaction(params: SignTransactionOptions) {
    const txPrebuild = params.txPrebuild;
    const payload = txPrebuild.payload;
    const signatureBuffer = this.signMessage(params, payload);
    const signature: string = signatureBuffer.toString('hex');
    return { halfSigned: { payload, signature } };
  }

  /**
   * Check if an address is valid for this ofc token.
   *
   * These addresses are either bg-<publicid>, where public id is the internal address to send to,
   * or are an address which is valid on the backing coin of this ofc token.
   * @param address address to check for validity
   */
  isValidAddress(address?: string): boolean {
    if (!isString(address)) {
      return false;
    }
    if (address.startsWith('bg-')) {
      const parts = address.split('-');
      const accountId = parts[1];
      return parts.length === 2 && publicIdRegex.test(accountId);
    } else {
      const backingCoin = this.bitgo.coin(this.backingCoin);
      return backingCoin.isValidAddress(address);
    }
  }
}
