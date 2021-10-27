/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';

import {
  BaseCoin,
  KeyPair,
  SignedTransaction,
  TransactionExplanation,
  TransactionRecipient,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  SignTransactionOptions,
  TransactionPrebuild as BaseTransactionPrebuild,
} from '../baseCoin';
import { NodeCallback } from '../types';
import { BitGo } from '../../bitgo';
import { MethodNotImplementedError } from '../../errors';

// const co = Bluebird.coroutine;

export interface TransactionFee {
  fee: string;
}
export type SolTransactionExplanation = TransactionExplanation;

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  publicKeys?: string[];
  feeInfo: TransactionFee;
}

export interface TxInfo {
  recipients: TransactionRecipient[];
  from: string;
  txid: string;
}

export interface SolSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string | string[];
  pubKeys?: string[];
}
export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  txInfo: TxInfo;
  source: string;
}

export class Sol extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Sol(bitgo, staticsCoin);
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
    throw new MethodNotImplementedError('verifyTransaction method not implemented');
  }

  verifyAddress(params: VerifyAddressOptions): boolean {
    throw new MethodNotImplementedError('verifyAddress method not implemented');
  }

  /**
   * Generate Solana key pair
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    throw new MethodNotImplementedError('generateKeyPair method not implemented');
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {string} pub the prv to be checked
   * @returns is it valid?
   */
  isValidPub(pub: string): boolean {
    throw new MethodNotImplementedError('isValidPub method not implemented');
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {string} prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    throw new MethodNotImplementedError('isValidPrv method not implemented');
  }

  isValidAddress(address: string): boolean {
    throw new MethodNotImplementedError('isValidAddress method not implemented');
  }

  /**
   * Signs Solana transaction
   * @param params
   * @param callback
   */
  signTransaction(
    params: SolSignTransactionOptions,
    callback?: NodeCallback<SignedTransaction>
  ): Bluebird<SignedTransaction> {
    throw new MethodNotImplementedError('signTransaction method not implemented');
  }

  parseTransaction(params: any, callback?: NodeCallback<any>): Bluebird<any> {
    throw new MethodNotImplementedError('parseTransaction method not implemented');
  }

  /**
   * Explain a Solana transaction from txHex
   * @param params
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions,
    callback?: NodeCallback<SolTransactionExplanation>
  ): Bluebird<SolTransactionExplanation> {
    throw new MethodNotImplementedError('explainTransaction method not implemented');
  }
}
