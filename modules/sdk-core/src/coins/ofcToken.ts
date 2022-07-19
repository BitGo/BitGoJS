/**
 * @prettier
 */
import { OfcTokenConfig } from '@bitgo/statics';
import { isString } from 'lodash';
import {
  BitGoBase,
  CoinConstructor,
  SignTransactionOptions as BaseSignTransactionOptions,
  SignedTransaction,
} from '../';
import { Ofc } from './ofc';

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: {
    payload: string;
  };
  prv: string;
}

export { OfcTokenConfig };

const publicIdRegex = /^[a-f\d]{32}$/i;
export class OfcToken extends Ofc {
  public readonly tokenConfig: OfcTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: OfcTokenConfig) {
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
    return (bitgo: BitGoBase) => new OfcToken(bitgo, config);
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * @returns {Promise<SignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const txPrebuild = params.txPrebuild;
    const payload = txPrebuild.payload;
    const signatureBuffer = (await this.signMessage(params, payload)) as any;
    const signature: string = signatureBuffer.toString('hex');
    return { halfSigned: { payload, signature } } as any;
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
