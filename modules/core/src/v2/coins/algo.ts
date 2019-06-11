/**
 * @prettier
 */
import { BaseCoin } from '../baseCoin';
import * as _ from 'lodash';

const {
  NaclWrapper,
  Multisig,
  Address,
  Seed,
  generateAccountFromSeed,
  generateAccount,
  isValidAddress,
  isValidSeed,
} = require('algosdk');

interface KeyPair {
  pub: string;
  prv: string;
}

const MAX_ALGORAND_NOTE_LENGTH = 1024;

export class Algo extends BaseCoin {

  constructor(bitgo) {
    super(bitgo);
  }

  static createInstance(bitgo: any): BaseCoin {
    return new Algo(bitgo);
  }

  getChain(): string {
    return 'algo';
  }

  getFamily(): string {
    return 'algo';
  }

  getFullName(): string {
    return 'Algorand';
  }

  getBaseFactor(): any {
    return 1e6;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    // TODO: this sounds like its true with the staking txes - confirm before launch
    return false;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const pair = seed ? generateAccountFromSeed(seed) : generateAccount();
    return {
      pub: pair.addr, // encoded pub
      prv: Seed.encode(pair.sk), // encoded seed
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub): boolean {
    return isValidAddress(pub);
  }

  /**
   * Return boolean indicating whether input is valid seed for the coin
   * In Algorand, when the private key is encoded as base32 string only the first 32 bytes are taken,
   * so the encoded value is actually the seed
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv): boolean {
    return isValidSeed(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address): boolean {
    return isValidAddress(address);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key, message): Buffer {
    // key.prv actually holds the encoded seed, but we use the prv name to avoid breaking the keypair schema.
    // See jsdoc comment in isValidPrv
    let seed = key.prv;
    if (!this.isValidPrv(seed)) {
      throw new Error(`invalid seed: ${seed}`);
    }
    if (typeof seed === 'string') {
      try {
        seed = Seed.decode(seed).seed;
      } catch (e) {
        throw new Error(`could not decode seed: ${seed}`);
      }
    }
    const keyPair = generateAccountFromSeed(seed);

    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message);
    }

    return Buffer.from(NaclWrapper.sign(message, keyPair.sk));
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   */
  signTransaction(params) {
    const prv = params.prv;
    const txData = params.txPrebuild.txData;
    const addressVersion = params.wallet.addressVersion;

    if (_.isUndefined(txData)) {
      throw new Error('missing txPrebuild parameter');
    }

    if (!_.isObject(txData)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txData}`);
    }

    if (_.isUndefined(prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }

    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    if (!_.has(params, 'keychain') || !_.has(params, 'backupKeychain') || !_.has(params, 'bitgoKeychain')) {
      throw new Error('missing public keys parameter to sign transaction');
    }

    if (!_.isNumber(addressVersion)) {
      throw new Error('missing addressVersion parameter to sign transaction');
    }

    const refinedTxData = txData;
    refinedTxData.amount = parseInt(txData.amount, 10);

    // if note is truly null, we need to pass an array
    if (!_.has(txData, 'note')) {
      refinedTxData.note = new Uint8Array(0);
    } else {
      // if note was passed as null, assume its an empty string
      if (txData.note === null) {
        txData.note = '';
      }

      // note has a maximum length
      if (txData.note.length > MAX_ALGORAND_NOTE_LENGTH) {
        throw new Error('note size exceeded specification');
      }
    }

    // we need to re-encode our public keys using algosdk's format
    const encodedPublicKeys = [
      Address.decode(params.keychain.pub).publicKey,
      Address.decode(params.backupKeychain.pub).publicKey,
      Address.decode(params.bitgoKeychain.pub).publicKey,
    ];

    // re-encode sk from our prv (this acts as a seed out of the keychain)
    const seed = Seed.decode(prv).seed;
    const pair = generateAccountFromSeed(seed);
    const sk = pair.sk;

    // sign
    const transaction = new Multisig.MultiSigTransaction(refinedTxData);
    const halfSigned = transaction.partialSignTxn(
      { version: addressVersion, threshold: 2, pks: encodedPublicKeys },
      sk
    );

    return {
      halfSigned: halfSigned,
    };
  }
}
