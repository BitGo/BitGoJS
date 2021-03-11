/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as accountLib from '@bitgo/account-lib';
import { ECPair } from '@bitgo/utxo-lib';
import { BaseCoin, KeyPair, SignedTransaction, VerifyAddressOptions, VerifyTransactionOptions } from '../baseCoin';
import { NodeCallback } from '../types';
import { BitGo } from '../../bitgo';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';

const co = Bluebird.coroutine;

interface SupplementGenerateWalletOptions {
  rootPrivateKey?: string;
}

export class Stx extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Stx(bitgo, staticsCoin);
  }

  getChain(): string {
    return this._staticsCoin.name;
  }
  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }
  getFullName(): string {
    return this._staticsCoin.fullName;
  }
  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    // TODO: Implement when available on the SDK.
    return Bluebird.resolve(true).asCallback(callback);
  }
  verifyAddress(params: VerifyAddressOptions): boolean {
    // TODO: Implement when available on the SDK.
    throw true;
  }

  /**
   * Generate Stacks key pair
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new accountLib.Stx.KeyPair({ seed }) : new accountLib.Stx.KeyPair();
    const keys = keyPair.getKeys();

    if (!keys.prv) {
      throw new Error('Missing xprv in key generation.');
    }

    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {string} pub the prv to be checked
   * @returns is it valid?
   */
  isValidPub(pub: string): boolean {
    try {
      return accountLib.Stx.Utils.isValidPublicKey(pub);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {string} prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    try {
      return accountLib.Stx.Utils.isValidPrivateKey(prv);
      return true;
    } catch (e) {
      return false;
    }
  }

  isValidAddress(address: string): boolean {
    try {
      return accountLib.Stx.Utils.isValidAddress(address);
      return true;
    } catch (e) {
      return false;
    }
  }

  signTransaction(params: any): Bluebird<SignedTransaction> {
    throw new Error('Method not implemented.');
  }
  parseTransaction(params: any, callback?: NodeCallback<any>): Bluebird<any> {
    throw new Error('Method not implemented.');
  }
}
