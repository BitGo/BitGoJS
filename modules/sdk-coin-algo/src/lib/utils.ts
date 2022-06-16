import algosdk from 'algosdk';
import stellar from 'stellar-sdk';
import * as hex from '@stablelib/hex';
import * as nacl from 'tweetnacl';
import base32 from 'hi-base32';
import sha512 from 'js-sha512';
import _ from 'lodash';
import { Address, EncodedTx, Seed } from './ifaces';
import { KeyPair } from './keyPair';
import { SeedEncoding } from './seedEncoding';
import * as algoNacl from 'algosdk/dist/cjs/src/nacl/naclWrappers';
import * as encoding from 'algosdk/dist/cjs/src/encoding/encoding';
import {
  BaseUtils,
  NotImplementedError,
  InvalidTransactionError,
  InvalidKey,
  isValidEd25519PublicKey,
  isValidEd25519SecretKey,
} from '@bitgo/sdk-core';

const ALGORAND_CHECKSUM_BYTE_LENGTH = 4;
const ALGORAND_SEED_LENGTH = 58;
const ALGORAND_SEED_BYTE_LENGTH = 36;
const ALGORAND_TRANSACTION_LENGTH = 52;
const SEED_BYTES_LENGTH = 32;

/**
 * Determines whether the string is only composed of hex chars.
 *
 * @param {string} maybe The string to be validated.
 * @returns {boolean} true if the string consists of only hex characters, otherwise false.
 */
function allHexChars(maybe: string): boolean {
  return /^([0-9a-f]{2})+$/i.test(maybe);
}

/**
 * ConcatArrays takes two array and returns a joint array of both
 *
 * @param a {Uint8Array} first array to concat
 * @param b {Uint8Array} second array
 * @returns {Uint8Array} a new array containing all elements of 'a' followed by all elements of 'b'
 */
function concatArrays(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
}

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return algosdk.isValidAddress(address);
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    if (txId.length !== 104) {
      return false;
    }

    return allHexChars(txId);
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    return isValidEd25519PublicKey(key);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    return isValidEd25519SecretKey(key);
  }

  /**
   * Returns an hex string of the given buffer
   *
   * @param {Uint8Array} buffer - the buffer to be converted to hex
   * @returns {string} - the hex value
   */
  toHex(buffer: Uint8Array): string {
    return hex.encode(buffer, true);
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('isValidSignature not implemented.');
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new NotImplementedError('hash not implemented.');
  }

  /**
   * Compare two Keys
   *
   * @param {Uint8Array} key1 - key to be compare
   * @param {Uint8Array} key2 - key to be compare
   * @returns {boolean} - returns true if both keys are equal
   */
  areKeysEqual(key1: Uint8Array, key2: Uint8Array): boolean {
    return nacl.verify(key1, key2);
  }

  /**
   * Returns a Uint8Array of the given hex string
   *
   * @param {string} str - the hex string to be converted
   * @returns {string} - the Uint8Array value
   */
  toUint8Array(str: string): Uint8Array {
    return Buffer.from(str, 'hex');
  }

  /**
   * Determines whether a seed is valid.
   *
   * @param {string} seed - the seed to be validated
   * @returns {boolean} - true if the seed is valid
   */
  isValidSeed(seed: string): boolean {
    if (typeof seed !== 'string') return false;

    if (seed.length !== ALGORAND_SEED_LENGTH) return false;

    // Try to decode
    let decoded;
    try {
      decoded = this.decodeSeed(seed);
    } catch (e) {
      return false;
    }

    // Compute checksum
    const checksum = new Uint8Array(
      sha512.sha512_256.array(decoded.seed).slice(SEED_BYTES_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH, SEED_BYTES_LENGTH)
    );

    // Check if the checksum matches the one from the decoded seed
    return _.isEqual(checksum, decoded.checksum);
  }

  /**
   * Encode an algo seed
   *
   * @param  {Buffer} secretKey - the valid secretKey .
   * @returns {string} - the seed to be validated.
   */
  encodeSeed(secretKey: Buffer): string {
    // get seed
    const seed = secretKey.slice(0, SEED_BYTES_LENGTH);
    // compute checksum
    const checksum = Buffer.from(
      sha512.sha512_256.array(seed).slice(SEED_BYTES_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH, SEED_BYTES_LENGTH)
    );
    const encodedSeed = base32.encode(concatArrays(seed, checksum));

    return encodedSeed.toString().slice(0, ALGORAND_SEED_LENGTH); // removing the extra '===='
  }

  /**
   * decodeSeed decodes an algo seed
   *
   * Decoding algo seed is same as decoding address.
   * Latest version of algo sdk (1.9, at this writing) does not expose explicit method for decoding seed.
   * Parameter is decoded and split into seed and checksum.
   *
   * @param {string} seed - hex or base64 encoded seed to be validated
   * @returns {Seed} - validated object Seed
   */
  decodeSeed(seed: string): Seed {
    // try to decode
    const decoded = base32.decode.asBytes(seed);

    // Sanity check
    if (decoded.length !== ALGORAND_SEED_BYTE_LENGTH) throw new Error('seed seems to be malformed');
    return {
      seed: new Uint8Array(decoded.slice(0, ALGORAND_SEED_BYTE_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH)),
      checksum: new Uint8Array(decoded.slice(SEED_BYTES_LENGTH, ALGORAND_SEED_BYTE_LENGTH)),
    };
  }

  /**
   * Verifies if signature for message is valid.
   *
   * @param pub {Uint8Array} public key
   * @param message {Uint8Array} signed message
   * @param signature {Buffer} signature to verify
   * @returns {Boolean} true if signature is valid.
   */
  verifySignature(message: Uint8Array, signature: Buffer, pub: Uint8Array): boolean {
    return nacl.sign.detached.verify(message, signature, pub);
  }

  /**
   * Transforms an Ed25519 public key into an algorand address.
   *
   * @param {Uint8Array} pk The Ed25519 public key.
   * @see https://developer.algorand.org/docs/features/accounts/#transformation-public-key-to-algorand-address
   *
   * @returns {string} The algorand address.
   */
  publicKeyToAlgoAddress(pk: Uint8Array): string {
    return new KeyPair({ pub: Buffer.from(pk).toString('hex') }).getAddress();
  }
  /**
   * Checks if a unsigned algo transaction can be decoded.
   *
   * @param {Uint8Array} txn The encoded unsigned transaction.
   * @returns {boolean} true if the transaction can be decoded, otherwise false
   */
  protected isDecodableUnsignedAlgoTxn(txn: Uint8Array): boolean {
    try {
      algosdk.decodeUnsignedTransaction(txn);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if a signed algo transaction can be decoded.
   *
   * @param {Uint8Array} txn The encoded signed transaction.
   * @returns {boolean} true if the transaction can be decoded, otherwise false
   */
  protected isDecodableSignedTransaction(txn: Uint8Array): boolean {
    try {
      algosdk.decodeSignedTransaction(txn);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Decodes a signed or unsigned algo transaction.
   *
   * @param {Uint8Array | string} txnBytes The encoded unsigned or signed txn.
   * @returns {EncodedTx} The decoded transaction.
   */
  decodeAlgoTxn(txnBytes: Uint8Array | string): EncodedTx {
    let buffer =
      typeof txnBytes === 'string'
        ? Buffer.from(txnBytes, allHexChars(txnBytes) ? 'hex' : 'base64')
        : Buffer.from(txnBytes);

    // In order to maintain backward compatibility with old keyreg transactions encoded with
    // forked algosdk 1.2.0 (https://github.com/BitGo/algosdk-bitgo),
    // the relevant information is extracted and parsed following the latest algosdk
    // release standard.
    // This way we can decode transactions successfully by still maintaining backward compatibility.
    const decodedTx = encoding.decode(buffer);
    if (
      decodedTx.txn &&
      decodedTx.txn.type === 'keyreg' &&
      decodedTx.txn.votefst &&
      decodedTx.txn.votelst &&
      decodedTx.txn.votekd
    ) {
      decodedTx.txn.votekey = decodedTx.txn.votekey || decodedTx.msig.subsig[0].pk;
      decodedTx.txn.selkey = decodedTx.txn.selkey || decodedTx.msig.subsig[0].pk;
      buffer = decodedTx.msig || decodedTx.sig ? encoding.encode(decodedTx) : encoding.encode(decodedTx.txn);
    }

    try {
      return this.tryToDecodeUnsignedTransaction(buffer);
    } catch {
      // Ignore error to try different format
    }

    try {
      return this.tryToDecodeSignedTransaction(buffer);
    } catch {
      throw new InvalidTransactionError('Transaction cannot be decoded');
    }
  }

  /**
   * Try to decode a signed Algo transaction
   * @param buffer the encoded transaction
   * @returns { EncodedTx } the decoded signed transaction
   * @throws error if it is not a valid encoded signed transaction
   */
  tryToDecodeSignedTransaction(buffer: Buffer): EncodedTx {
    // TODO: Replace with
    // return algosdk.Transaction.from_obj_for_encoding(algosdk.decodeSignedTransaction(buffer).txn);
    // see: https://github.com/algorand/js-algorand-sdk/issues/364
    // "...some parts of the codebase treat the output of Transaction.from_obj_for_encoding as EncodedTransaction.
    // They need to be fixed(or we at least need to make it so Transaction conforms to EncodedTransaction)."
    const tx = algosdk.decodeSignedTransaction(buffer);

    const signers: string[] = [];
    const signedBy: string[] = [];
    if (tx.msig && tx.msig.subsig) {
      for (const sig of tx.msig.subsig) {
        const addr = algosdk.encodeAddress(sig.pk);
        signers.push(addr);
        if (sig.s) {
          signedBy.push(addr);
        }
      }
    }

    return {
      rawTransaction: new Uint8Array(buffer),
      txn: tx.txn,
      signed: true,
      signers: signers,
      signedBy: signedBy,
    };
  }

  /**
   * Try to decode an unsigned Algo transaction
   * @param buffer the encoded transaction
   * @returns {EncodedTx} the decoded unsigned transaction
   * @throws error if it is not a valid encoded unsigned transaction
   */
  tryToDecodeUnsignedTransaction(buffer: Buffer): EncodedTx {
    const txn = algosdk.decodeUnsignedTransaction(buffer);
    return {
      rawTransaction: new Uint8Array(buffer),
      txn,
      signed: false,
    };
  }

  /*
   * encodeObj takes a javascript object and returns its msgpack encoding
   * Note that the encoding sorts the fields alphabetically
   *
   * @param {Record<string | number | symbol, any>} obj js obj
   * @returns {Uint8Array} Uint8Array binary representation
   */
  encodeObj(obj: Record<string | number | symbol, any>): Uint8Array {
    return algosdk.encodeObj(obj);
  }

  /**
   * decodeObj takes a Uint8Array and returns its javascript obj
   * @param o - Uint8Array to decode
   * @returns object
   */
  decodeObj(o: ArrayLike<number>): unknown {
    return algosdk.decodeObj(o);
  }

  /**
   * secretKeyToMnemonic takes an Algorant secret key and returns the corresponding mnemonic
   *
   * @param sk - Algorant secret key
   * @return Secret key is associated mnemonic
   */
  secretKeyToMnemonic(sk: Buffer): string {
    const skValid = Buffer.from(sk.toString('hex'));
    if (!this.isValidPrivateKey(skValid.toString('hex'))) {
      throw new InvalidKey(`The secret key: ${sk.toString('hex')} is invalid`);
    }
    const skUnit8Array = Buffer.from(sk);
    return algosdk.secretKeyToMnemonic(skUnit8Array);
  }

  /**
   * seedFromMnemonic converts a mnemonic generated using this library into the source key used to create it
   * It returns an error if the passed mnemonic has an incorrect checksum, if the number of words is unexpected, or if one
   * of the passed words is not found in the words list
   *
   * @param mnemonic - 25 words mnemonic
   * @returns 32 bytes long seed
   */
  seedFromMnemonic(mnemonic: string): Uint8Array {
    return algosdk.mnemonicToMasterDerivationKey(mnemonic);
  }

  /**
   * keyPairFromSeed generates an object with secretKey and publicKey using the algosdk
   * @param seed 32 bytes long seed
   * @returns KeyPair
   */
  keyPairFromSeed(seed: Uint8Array): KeyPair {
    const mn = this.mnemonicFromSeed(seed);
    const base64PrivateKey = algosdk.mnemonicToSecretKey(mn).sk;
    return this.createKeyPair(base64PrivateKey);
  }

  /**
   * Generate a new `KeyPair` object from the given private key.
   *
   * @param base64PrivateKey 64 bytes long privateKey
   * @returns KeyPair
   */
  protected createKeyPair(base64PrivateKey: Uint8Array): KeyPair {
    const sk = base64PrivateKey.slice(0, 32);
    return new KeyPair({ prv: Buffer.from(sk).toString('hex') });
  }

  /**
   * decodePrivateKey generates a seed with a mnemonic and using algosdk.
   *
   * @param seed 32 bytes long seed
   * @returns mnemonic - 25 words mnemonic - 25 words mnemonic
   */
  protected mnemonicFromSeed(seed: Uint8Array): string {
    return algosdk.masterDerivationKeyToMnemonic(seed);
  }

  /**
   * Validates the key with the stellar-sdk
   *
   * @param publicKey
   * @returns boolean
   */
  protected isValidEd25519PublicKeyStellar(publicKey: string): boolean {
    return stellar.StrKey.isValidEd25519PublicKey(publicKey);
  }

  /**
   * Decodes the key with the stellar-sdk
   *
   * @param publicKey
   * @returns Buffer
   */
  protected decodeEd25519PublicKeyStellar(publicKey: string): Buffer {
    return stellar.StrKey.decodeEd25519PublicKey(publicKey);
  }

  /**
   * Convert a stellar seed to algorand encoding
   *
   * @param seed
   * @returns string the encoded seed
   */
  convertFromStellarSeed(seed: string): string {
    return SeedEncoding.encode(stellar.StrKey.decodeEd25519SecretSeed(seed));
  }

  /**
   * Returns an address encoded with algosdk
   *
   * @param addr
   * @returns string
   */
  encodeAddress(addr: Uint8Array): string {
    return algosdk.encodeAddress(addr);
  }

  /**
   * Return an address decoded with algosdk
   *
   * @param addr
   * @returns Address
   */
  decodeAddress(addr: string): Address {
    return algosdk.decodeAddress(addr);
  }

  /**
   * Converts an address into an ALGO one
   * If the given data is a Stellar address or public key, it is converted to ALGO address.
   *
   * @param addressOrPubKey an ALGO address, or an Stellar address or public key
   * @returns address algo address string
   */
  stellarAddressToAlgoAddress(addressOrPubKey: string): string {
    // we have an Algorand address
    if (this.isValidAddress(addressOrPubKey)) {
      return addressOrPubKey;
    }
    // we have a stellar key
    if (this.isValidEd25519PublicKeyStellar(addressOrPubKey)) {
      const stellarPub = this.decodeEd25519PublicKeyStellar(addressOrPubKey);
      const algoAddress = this.encodeAddress(stellarPub);
      if (this.isValidAddress(algoAddress)) {
        return algoAddress;
      }
      throw new Error('Cannot convert Stellar address to an Algorand address via pubkey.');
    }
    throw new Error('Neither an Algorand address nor a stellar pubkey.');
  }

  /**
   * multisigAddress takes multisig metadata (preimage) and returns the corresponding human readable Algorand address.
   *
   * @param {number} version mutlisig version
   * @param {number} threshold multisig threshold
   * @param {string[]} addrs list of Algorand addresses
   * @returns {string} human readable Algorand address.
   */
  multisigAddress(version: number, threshold: number, addrs: string[]): string {
    return algosdk.multisigAddress({
      version,
      threshold,
      addrs,
    });
  }

  /**
   * generateAccount generates un account with a secretKey and an address
   *
   * Function has not params
   * @returns Account
   */
  generateAccount(): algosdk.Account {
    return algosdk.generateAccount();
  }

  generateAccountFromSeed(seed: Uint8Array): algosdk.Account {
    const keys = nacl.sign.keyPair.fromSeed(seed);
    return {
      addr: algosdk.encodeAddress(keys.publicKey),
      sk: keys.secretKey,
    };
  }

  /**
   * Generates Tx ID from an encoded multisig transaction
   *
   * This is done because of a change made on version 1.10.1 on algosdk so method txID() only supports SignedTransaction type.
   * (https://github.com/algorand/js-algorand-sdk/blob/develop/CHANGELOG.md#1101)
   *
   * @param {string} txBase64 - encoded base64 multisig transaction
   * @returns {string} - transaction ID
   */
  getMultisigTxID(txBase64: string): string {
    const txBytes = Buffer.from(txBase64, 'base64');
    const decodeSignTx = algosdk.decodeSignedTransaction(txBytes);
    const wellFormedDecodedSignTx = decodeSignTx.txn.get_obj_for_encoding();
    const txForEncoding = { msig: decodeSignTx.msig, txn: wellFormedDecodedSignTx };
    const en_msg = encoding.encode(txForEncoding);
    const tag = Buffer.from([84, 88]);
    const gh = Buffer.from(concatArrays(tag, en_msg));
    const hash = Buffer.from(algoNacl.genericHash(gh));
    return base32.encode(hash).slice(0, ALGORAND_TRANSACTION_LENGTH);
  }

  /**
   * Determines if a given transaction data is to enable or disable a token
   * @param amount the amount in transaction
   * @param from the originated address
   * @param to the target address
   * @param closeRemainderTo (optional) address to send remaining units in originated address
   * @returns 'enableToken' or 'disableToken'
   */
  getTokenTxType(amount: string, from: string, to: string, closeRemainderTo?: string): string {
    let type = 'transferToken';
    if (amount === '0' && from === to) {
      type = !closeRemainderTo ? 'enableToken' : 'disableToken';
    }
    return type;
  }

  /**
   * Validate if the key is a valid base64 string
   * @param key the key to validate
   */
  validateBase64(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid base64 string');
    }
    const base64RegExp =
      /^(?:[a-zA-Z0-9+\/]{4})*(?:|(?:[a-zA-Z0-9+\/]{3}=)|(?:[a-zA-Z0-9+\/]{2}==)|(?:[a-zA-Z0-9+\/]{1}===))$/;
    if (!base64RegExp.test(key)) {
      throw new Error('Invalid base64 string');
    }
  }
}

const utils = new Utils();

export default utils;
