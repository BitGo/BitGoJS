import * as accountLib from '@bitgo/account-lib';
import * as _ from 'lodash';
import { BitGo } from '../../bitgo';
import { MethodNotImplementedError } from '../../errors';
import {
  BaseCoin,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '../baseCoin';

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  key: string;
  addressVersion: number;
  validity: {
    firstValid: number;
  };
  blockHash: string;
  version: number;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface VerifiedTransactionParameters {
  txHex: string;
  addressVersion: number;
  prv: string;
  signer: string;
}

const nearUtils = accountLib.Near.Utils.default;

export class Near extends BaseCoin {
  constructor(bitgo: BitGo) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Near(bitgo);
  }

  getChain(): string {
    return 'near';
  }

  getBaseChain(): string {
    return 'near';
  }

  getFamily(): string {
    return 'near';
  }

  getFullName(): string {
    return 'Near';
  }

  getBaseFactor(): any {
    return 1e24;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed
      ? new accountLib.Near.KeyPair({ seed })
      : new accountLib.Near.KeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv + keys.pub,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return nearUtils.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether the supplied private key is a valid near private key
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return nearUtils.isValidPrivateKey(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return nearUtils.isValidAddress(address);
  }

  /**
   * Flag indicating if this coin supports TSS wallets.
   * @returns {boolean} True if TSS Wallets can be created for this coin
   */
  supportsTss(): boolean {
    return true;
  }


  /**
   * Explain/parse transaction
   * @param params
   */
  explainTransaction(
    params: ExplainTransactionOptions,
  ): Promise<any> {
    throw new MethodNotImplementedError('Near recovery not implemented');
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const prv = params.prv;
    const addressVersion = params.txPrebuild.addressVersion;

    const txHex = params.txPrebuild.txHex;

    if (_.isUndefined(txHex)) {
      throw new Error('missing txPrebuild parameter');
    }

    if (!_.isString(txHex)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txHex}`);
    }

    if (_.isUndefined(prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }

    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    if (!_.has(params.txPrebuild, 'key')) {
      throw new Error('missing public key parameter to sign transaction');
    }

    if (!_.isNumber(addressVersion)) {
      throw new Error('missing addressVersion parameter to sign transaction');
    }

    // if we are receiving addresses do not try to convert them
    const signer = !nearUtils.isValidAddress(params.txPrebuild.key)
      ? new accountLib.Near.KeyPair({ pub: params.txPrebuild.key }).getAddress()
      : params.txPrebuild.key;
    return { txHex, addressVersion, prv, signer };
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {TransactionPrebuild} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param callback
   * @returns {Bluebird<SignedTransaction>}
   */
  signTransaction(
    params: SignTransactionOptions,
  ): Promise<SignedTransaction> {
    throw new MethodNotImplementedError('Near recovery not implemented');
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: any): Promise<any> {
    throw new MethodNotImplementedError('Near recovery not implemented');
  }

  parseTransaction(
    params: ParseTransactionOptions,
  ): Promise<ParsedTransaction> {
    throw new MethodNotImplementedError('Near parse transaction not implemented');
  }

  isWalletAddress(params: VerifyAddressOptions): boolean {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new MethodNotImplementedError('Near verify transaction not implemented');
  }

  getAddressFromPublicKey(Pubkey: string): string {
    return new accountLib.Near.KeyPair({ pub: Pubkey }).getAddress();
  }
}
