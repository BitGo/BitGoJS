import * as accountLib from '@bitgo/account-lib';
import * as Bluebird from 'bluebird';
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
import { NodeCallback } from '../types';

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

export class Dot extends BaseCoin {
  constructor(bitgo: BitGo) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Dot(bitgo);
  }

  getChain(): string {
    return 'dot';
  }

  getBaseChain(): string {
    return 'dot';
  }

  getFamily(): string {
    return 'dot';
  }

  getFullName(): string {
    return 'Polkadot';
  }

  getBaseFactor(): any {
    return 1e12;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed
      ? accountLib.Dot.Utils.default.keyPairFromSeed(new Uint8Array(seed))
      : new accountLib.Dot.KeyPair();
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
    return accountLib.Dot.Utils.default.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether the supplied private key is a valid dot private key
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return accountLib.Dot.Utils.default.isValidPrivateKey(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return accountLib.Dot.Utils.default.isValidAddress(address);
  }

  /**
   * Explain/parse transaction
   * @param params
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions,
    callback?: NodeCallback<any>
  ): Bluebird<any> {
    throw new MethodNotImplementedError('Dot recovery not implemented');
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
    const signer = !accountLib.Dot.Utils.default.isValidAddress(params.txPrebuild.key)
      ? new accountLib.Dot.KeyPair({ pub: params.txPrebuild.key }).getAddress()
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
    callback?: NodeCallback<SignedTransaction>
  ): Bluebird<SignedTransaction> {
    throw new MethodNotImplementedError('Dot recovery not implemented');
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * @param callback
   */
  recover(params: any, callback?: NodeCallback<any>): Bluebird<any> {
    throw new MethodNotImplementedError('Dot recovery not implemented');
  }

  parseTransaction(
    params: ParseTransactionOptions,
    callback?: NodeCallback<ParsedTransaction>
  ): Bluebird<ParsedTransaction> {
    return Bluebird.resolve({}).asCallback(callback);
  }

  verifyAddress(params: VerifyAddressOptions): boolean {
    return true;
  }

  verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    return Bluebird.resolve(true).asCallback(callback);
  }

  getAddressFromPublicKey(Pubkey: string): string {
    return new accountLib.Dot.KeyPair({ pub: Pubkey }).getAddress();
  }
}
