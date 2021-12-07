/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
import * as accountLib from '@bitgo/account-lib';
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
import base58 = require('bs58');

export interface TransactionFee {
  fee: string;
}
export type SolTransactionExplanation = TransactionExplanation;

export interface ExplainTransactionOptions {
  txBase64: string;
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
  txBase64: string;
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

  // TODO (https://bitgoinc.atlassian.net/browse/STLX-10202)
  verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    throw new MethodNotImplementedError('verifyTransaction method not implemented');
  }

  verifyAddress(params: VerifyAddressOptions): boolean {
    return this.isValidAddress(params.address);
  }

  /**
   * Generate Solana key pair
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer | undefined): KeyPair {
    const result = seed ? new accountLib.Sol.KeyPair({ seed }).getKeys() : new accountLib.Sol.KeyPair().getKeys();
    return result as KeyPair;
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {string} pub the prv to be checked
   * @returns is it valid?
   */
  isValidPub(pub: string): boolean {
    return accountLib.Sol.Utils.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {string} prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    return accountLib.Sol.Utils.isValidPrivateKey(prv);
  }

  isValidAddress(address: string): boolean {
    return accountLib.Sol.Utils.isValidAddress(address);
  }

  signMessage(key: KeyPair, message: string | Buffer, callback?: NodeCallback<Buffer>): Bluebird<Buffer> {
    return co<Buffer>(function* cosignMessage() {
      const solKeypair = new accountLib.Sol.KeyPair({ prv: key.prv });
      if (Buffer.isBuffer(message)) {
        message = base58.encode(message);
      }

      return Buffer.from(solKeypair.signMessage(message));
    })
      .call(this)
      .asCallback(callback);
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
    const self = this;
    return co<SignedTransaction>(function* () {
      const factory = accountLib.register(self.getChain(), accountLib.Sol.TransactionBuilderFactory);
      const txBuilder = factory.from(params.txPrebuild.txBase64);
      txBuilder.sign({ key: params.prv });
      const transaction: accountLib.BaseCoin.BaseTransaction | undefined = yield txBuilder.build();

      if (!transaction) {
        throw new Error('Invalid transaction');
      }

      return {
        txBase64: (transaction as accountLib.BaseCoin.BaseTransaction).toBroadcastFormat(),
      };
    })
      .call(this)
      .asCallback(callback);
  }

  parseTransaction(params: any, callback?: NodeCallback<any>): Bluebird<any> {
    throw new MethodNotImplementedError('parseTransaction method not implemented');
  }

  /**
   * Explain a Solana transaction from txBase64
   * @param params
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions,
    callback?: NodeCallback<SolTransactionExplanation>
  ): Bluebird<SolTransactionExplanation> {
    const self = this;
    return co<SolTransactionExplanation>(function* () {
      const factory = accountLib.register(self.getChain(), accountLib.Sol.TransactionBuilderFactory);
      let rebuiltTransaction;

      try {
        rebuiltTransaction = yield factory.from(params.txBase64).fee({ amount: params.feeInfo.fee }).build();
      } catch {
        throw new Error('Invalid transaction');
      }

      const explainedTransaction = (rebuiltTransaction as accountLib.BaseCoin.BaseTransaction).explainTransaction();

      return explainedTransaction as SolTransactionExplanation;
    })
      .call(this)
      .asCallback(callback);
  }
}
