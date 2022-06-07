import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
import {
  BaseCoin,
  BitGoBase,
  KeyPair,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  SignTransactionOptions,
  SignedTransaction,
  ParseTransactionOptions,
  TransactionExplanation,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionRecipient,
} from '@bitgo/sdk-core';
import { MethodNotImplementedError } from '../../errors';

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  publicKeys?: string[];
}

export interface TxInfo {
  recipients: TransactionRecipient[];
  from: string;
  txid: string;
}

export interface AvaxpSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string | string[];
  pubKeys?: string[];
}
export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  txInfo: TxInfo;
  source: string;
}

export class AvaxP extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new AvaxP(bitgo, staticsCoin);
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

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new MethodNotImplementedError('verifyTransaction method not implemented');
  }

  verifyAddress(params: VerifyAddressOptions): boolean {
    throw new MethodNotImplementedError('verifyAddress method not implemented');
  }

  /**
   * Check if address is valid, then make sure it matches the root address.
   *
   * @param {VerifyAddressOptions} params address and rootAddress to verify
   */
  isWalletAddress(params: VerifyAddressOptions): boolean {
    return true;
  }
  /**
   * Generate Avaxp key pair
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
   * Signs Avaxp transaction

   */
  signTransaction(params: AvaxpSignTransactionOptions): Promise<SignedTransaction> {
    throw new MethodNotImplementedError('signTransaction method not implemented');
  }

  parseTransaction(params: any): Promise<ParseTransactionOptions> {
    throw new MethodNotImplementedError('parseTransaction method not implemented');
  }

  /**
   * Explain a Avaxp transaction from txHex
   * @param params
   * @param callback
   */
  explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    throw new MethodNotImplementedError('explainTransaction method not implemented');
  }
}
