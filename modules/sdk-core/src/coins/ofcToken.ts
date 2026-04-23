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
  ITransactionRecipient,
  IWallet,
} from '../';
import { isBolt11Invoice } from '../lightning';

import { Ofc } from './ofc';

type OfcAllowRemoteSignOptions = BaseSignTransactionOptions & {
  txPrebuild: { payload: string };
  wallet: IWallet;
  prv?: string; // optional: forwarded to signPayload if present
};

type OfcLocalSignOptions = BaseSignTransactionOptions & {
  txPrebuild: { payload: string };
  prv: string;
  wallet?: never; // excludes wallet from this branch
};

export type SignTransactionOptions = OfcAllowRemoteSignOptions | OfcLocalSignOptions;

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

  checkRecipient(recipient: ITransactionRecipient): void {
    if (isBolt11Invoice(recipient.address)) {
      // should throw error if this isnt bitcoin (mainnet or testnet)
      if (this.backingCoin !== 'btc' && this.backingCoin !== 'tbtc') {
        throw new Error(`invalid argument - lightning invoice is only supported for bitcoin`);
      }

      // amount for bolt11 invoices must be a non-zero bigint
      let amount: bigint;
      try {
        amount = BigInt(recipient.amount);
      } catch (e) {
        throw new Error(
          `invalid argument ${recipient.amount} for amount - lightning invoice amount must be a non-zero bigint`
        );
      }
      if (amount > 0n) {
        return;
      }
      throw new Error(`invalid argument for amount - lightning invoice amount must be a non-zero bigint`);
    }

    super.checkRecipient(recipient);
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
   * Signs a half-signed OFC transaction.
   * Signs the transaction remotely using the BitGo key if prv is not provided.
   * @param params
   * @returns {Promise<SignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const txPrebuild = params.txPrebuild;
    const payload = txPrebuild.payload;

    let signature: string;
    if (params.wallet) {
      const tradingAccount = params.wallet.toTradingAccount();
      if (!params.prv && tradingAccount.userKeySigningRequired) {
        throw new Error(
          'Wallet must use user key to sign ofc transaction, please provide the private key or visit your wallet settings page to configure one.'
        );
      }
      signature = await tradingAccount.signPayload({ payload, prv: params.prv });
    } else if (params.prv) {
      signature = (await this.signMessage({ prv: params.prv }, payload)).toString('hex');
    } else {
      throw new Error('You must pass in either one of wallet or prv');
    }

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
      if (this.backingCoin === 'btc' || this.backingCoin === 'tbtc') {
        return (
          backingCoin as unknown as { isValidAddress(address: string, params: { allowLightning: boolean }): boolean }
        ).isValidAddress(address, { allowLightning: true });
      }
      return backingCoin.isValidAddress(address);
    }
  }
}
