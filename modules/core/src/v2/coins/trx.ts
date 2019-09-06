/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
const tronweb = require('tronweb');

import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { MethodNotImplementedError } from '../../errors';
import {
  BaseCoin,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
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
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const account = tronweb.utils.accounts.generateAccount();
    return {
      pub: account.address.publicKey,
      prv: account.privateKey,
    };
  }

  /**
   * Get an instance of the library which can be used to perform low-level operations for this coin
   */
  getCoinLibrary() {
    return tronweb;
  }

  isValidPub(pub: string): boolean {
    throw new MethodNotImplementedError();
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

  signTransaction(params: SignTransactionOptions = {}): SignedTransaction {
    throw new MethodNotImplementedError();
  }
  
  /**
   * Derive a hardened child public key from a master key seed using an additional seed for randomness.
   *
   * Due to technical differences between keypairs on the ed25519 curve and the secp256k1 curve,
   * only hardened private key derivation is supported.
   *
   * @param key seed for the master key. Note: Not the public key or encoded private key. This is the raw seed.
   * @param entropySeed random seed which is hashed to generate the derivation path
   */
  deriveKeyWithSeed({ key, seed }: { key: string; seed: string }): { derivationPath: string; key: string } {
    // TODO: not sure if we need this just yet
    throw new Error();
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key: KeyPair, message: string | Buffer) {
    let toSign;
    if (typeof message === 'string') {
      toSign = message;
    } else if (Buffer.isBuffer(message)) {
      toSign = message.toString('hex');
    } else {
      throw new Error('Invalid messaged passed to signMessage');
    }

    // convert the hex string to their representation of a byte array
    const tronByteArray = tronweb.utils.code.hexStr2byteArray(toSign);

    // note the key in the keypair should already be hex-encoded
    return tronweb.utils.crypto.signBytes(key.prv, tronByteArray);
  }

  // it's possible we need to implement these later
  // preCreateBitGo?
  // supplementGenerateWallet?
}
