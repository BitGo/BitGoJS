/**
 * @prettier
 */
import { BaseCoin, KeyPair, SignedTransaction, VerifyAddressOptions, VerifyTransactionOptions } from '../baseCoin';
import { NodeCallback } from '../types';
import { BitGo } from '../../bitgo';
import { Cspr as CsprAccountLib } from '@bitgo/account-lib';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

import * as Bluebird from 'bluebird';
export class Cspr extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Cspr(bitgo, staticsCoin);
  }

  getChain(): string {
    return this._staticsCoin.name;
  }
  getFamily(): string {
    return this._staticsCoin.fullName;
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
   * Generate BLS key pair
   *
   * @param seed - byte array to generate BLS key pair from
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new CsprAccountLib.KeyPair({ seed }) : new CsprAccountLib.KeyPair();
    const keys = keyPair.getKeys();
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new CsprAccountLib.KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }
  signTransaction(paraCeloAccountLibms: any): Bluebird<SignedTransaction> {
    throw new Error('Method not implemented.');
  }
  parseTransaction(params: any, callback?: NodeCallback<any>): Bluebird<any> {
    throw new Error('Method not implemented.');
  }
}
