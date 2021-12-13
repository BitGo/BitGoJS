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
  referenceBlock: string;
  version: number;
  transaction?: any;
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

const dotUtils = accountLib.Dot.Utils.default;

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

  /** @inheritDoc **/
  supportsUserSingleSigWallet(): boolean {
    return true;
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
      ? dotUtils.keyPairFromSeed(new Uint8Array(seed))
      : new accountLib.Dot.KeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return dotUtils.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether the supplied private key is a valid dot private key
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return dotUtils.isValidPrivateKey(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return dotUtils.isValidAddress(address);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   * @return {Buffer} A signature over the given message using the given key
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const msg = Buffer.isBuffer(message) ? message.toString('utf8') : message;
    // reconstitute keys and sign
    return Buffer.from(new accountLib.Dot.KeyPair({ prv: key.prv }).signMessage(msg));
  }

  /**
   * Explain/parse transaction
   * @param params
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions,
  ): Promise<any> {
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

    if (!_.has(params, 'pubs')) {
      throw new Error('missing public key parameter to sign transaction');
    }

    if (!_.isNumber(addressVersion)) {
      // throw new Error('missing addressVersion parameter to sign transaction');
    }

    console.dir(params.txPrebuild.transaction, { depth: null });
    // const pubKey = params.txPrebuild.key;
    // if we are receiving addresses do not try to convert them
    const signer = '5FAeXHFGAG7TqTA3zaGz3AEUCiHyjKmqWfEPd56aXfGmF26z';
    return { txHex, addressVersion, prv, signer };
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {TransactionPrebuild} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @returns {Promise<SignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const { txHex, prv } = this.verifySignTransactionParams(params);
    const factory = accountLib.register(this.getChain(), accountLib.Dot.TransactionBuilderFactory);
    const keyPair = new accountLib.Dot.KeyPair({ prv: prv });
    const txBuilder = factory.from(txHex);
    txBuilder
      .validity({ firstValid: params.txPrebuild.transaction.blockNumber })
      .referenceBlock(params.txPrebuild.transaction.referenceBlock)
      .version(params.txPrebuild.transaction.transactionVersion)
      .sender({ address: params.txPrebuild.transaction.sender })
      .sign({ key: keyPair.getKeys().prv });
    const transaction: any = await txBuilder.build();
    if (!transaction) {
      throw new Error('Invalid transaction');
    }
    const signedTxHex = transaction.toBroadcastFormat();
    return { txHex: signedTxHex };
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: any): Promise<any> {
    throw new MethodNotImplementedError('Dot recovery not implemented');
  }

  async parseTransaction(
    params: ParseTransactionOptions,
  ): Promise<ParsedTransaction> {
    return {};
  }

  verifyAddress(params: VerifyAddressOptions): boolean {
    return this.isValidAddress(params.address);
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  getAddressFromPublicKey(Pubkey: string): string {
    return new accountLib.Dot.KeyPair({ pub: Pubkey }).getAddress();
  }
}
