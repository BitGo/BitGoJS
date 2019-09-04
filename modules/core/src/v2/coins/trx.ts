/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as tronweb from 'tronweb';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { MethodNotImplementedError } from '../../errors';
import {
  BaseCoin,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '../baseCoin';
import { BitGo } from '../../bitgo';
import { NodeCallback } from '../types';

export class Trx extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGo, staticsCoin: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    this._staticsCoin = staticsCoin;
  }

  getChain() {
    return this._staticsCoin.name;
  }

  getFamily() {
    return this._staticsCoin.family;
  }

  getFullName() {
    return this._staticsCoin.fullName;
  }

  getBaseFactor() {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  static createInstance(bitgo: BitGo, staticsCoin: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Trx(bitgo, staticsCoin);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  isValidAddress(address: string): boolean {
    return this.getCoinLibrary().isAddress(address);
  }

  /**
   * Get an instance of the library which can be used to perform low-level operations for this coin
   */
  getCoinLibrary() {
    return tronweb;
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    throw new MethodNotImplementedError();
  }

  isValidPub(pub: string): boolean {
    throw new MethodNotImplementedError();
  }

  parseTransaction(
    params: ParseTransactionOptions,
    callback?: NodeCallback<ParsedTransaction>
  ): Bluebird<ParsedTransaction> {
    throw new MethodNotImplementedError();
  }

  verifyAddress(params: VerifyAddressOptions): boolean {
    throw new MethodNotImplementedError();
  }

  verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    throw new MethodNotImplementedError();
  }
}
