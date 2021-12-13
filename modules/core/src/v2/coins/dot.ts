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
  prv: string;
  transactionVersion: number;
  sender: string;
  blockNumber: number;
  referenceBlock: string;
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
    if (!_.has(params, 'txPrebuild.txHex') && !_.isString(params.txPrebuild.txHex)) {
      throw new Error('missing or invalid txHex parameter');
    }
    const txHex = params.txPrebuild.txHex;

    if (!_.has(params, 'prv') && _.isUndefined(params.prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }
    const prv = params.prv;

    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    if (!_.has(params, 'txPrebuild.transaction')) {
      throw new Error('missing transaction signing parameters');
    }
    const txParams = params.txPrebuild.transaction;

    if (!_.has(txParams, 'transactionVersion') && !_.isNumber(txParams.transactionVersion)) {
      throw new Error('missing transactionVersion parameter to sign transaction');
    }
    const transactionVersion = txParams.transactionVersion;

    if (!_.has(txParams, 'sender') && this.isValidAddress(txParams.sender)) {
      throw new Error('missing sender parameter to sign transaction');
    }
    const sender = txParams.sender;

    if (!_.has(txParams, 'blockNumber') && !_.isNumber(txParams.blockNumber)) {
      throw new Error('missing blockNumber parameter to sign transaction');
    }
    const blockNumber = txParams.blockNumber;

    if (!_.has(txParams, 'sender') && this.isValidAddress(txParams.sender)) {
      throw new Error('missing sender address parameter to sign transaction');
    }
    const referenceBlock = txParams.referenceBlock;

    return { txHex, prv, transactionVersion, sender, blockNumber, referenceBlock };
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
    const { txHex, prv, transactionVersion, sender, blockNumber, referenceBlock } = this.verifySignTransactionParams(params);
    const factory = accountLib.register(this.getChain(), accountLib.Dot.TransactionBuilderFactory);
    const keyPair = new accountLib.Dot.KeyPair({ prv: prv });
    const txBuilder = factory.from(txHex);
    txBuilder
      .validity({ firstValid: blockNumber })
      .referenceBlock(referenceBlock)
      .version(transactionVersion)
      .sender({ address: sender })
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
