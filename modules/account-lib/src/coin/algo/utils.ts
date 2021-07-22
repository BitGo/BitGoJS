import crypto from 'crypto';
import algosdk from 'algosdk';
import * as hex from '@stablelib/hex';
import base32 from 'hi-base32';
import _ from 'lodash';
import { isValidEd25519PublicKey, isValidEd25519SecretKey } from '../../utils/crypto';
import { BaseUtils } from '../baseCoin';
import { InvalidKey, NotImplementedError, InvalidTransactionError } from '../baseCoin/errors';
import { EncodedTx } from './ifaces';

const ALGORAND_CHECKSUM_BYTE_LENGTH = 4;
const ALGORAND_ADDRESS_LENGTH = 58;

/**
 * Determines whether the string is a composed of hex chars only.
 *
 * @param {string} maybe The string to be validated.
 * @returns {boolean} true if the string consists of only hex characters, otherwise false.
 */
function allHexChars(maybe: string): boolean {
  return maybe.match(/^[0-9a-f]+$/i) !== null;
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

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('isValidSignature not implemented.');
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new NotImplementedError('hash not implemented.');
  }

  /**
   * Converts a hex string into a uint8 array object.
   *
   * @param {string} str A hex string.
   * @returns {Uint8Array} The byte representation of the hex string.
   */
  hexStringToUInt8Array(str: string): Uint8Array {
    return new Uint8Array(Buffer.from(str, 'hex'));
  }
  /**
   * Returns a Uint8Array of the given hex string
   *
   * @param {string} str - the hex string to be converted
   * @returns {string} - the Uint8Array value
   */
  toUint8Array(str: string): Uint8Array {
    return hex.decode(str);
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
    const pkHex = Buffer.from(pk).toString('hex');
    if (!this.isValidPublicKey(pkHex)) {
      throw new InvalidKey(`The public key: ${pkHex} is invalid`);
    }

    const hash = crypto.createHash('SHA512-256').update(pk).digest();
    const checksum = hash.slice(-ALGORAND_CHECKSUM_BYTE_LENGTH);

    const address = base32.encode(Buffer.concat([pk, checksum]));
    const addressWithPaddingRemoved = address.slice(0, ALGORAND_ADDRESS_LENGTH);

    return addressWithPaddingRemoved;
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
    } catch (_: unknown) {
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
    } catch (_: unknown) {
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
    const buffer = typeof txnBytes === 'string' ? Buffer.from(txnBytes, 'hex') : txnBytes;
    if (this.isDecodableUnsignedAlgoTxn(buffer)) {
      return {
        txn: algosdk.decodeUnsignedTransaction(buffer),
        signed: false,
      };
    } else if (this.isDecodableSignedTransaction(buffer)) {
      // TODO: Replace with
      // return algosdk.Transaction.from_obj_for_encoding(algosdk.decodeSignedTransaction(buffer).txn);
      // see: https://github.com/algorand/js-algorand-sdk/issues/364
      // "...some parts of the codebase treat the output of Transaction.from_obj_for_encoding as EncodedTransaction.
      // They need to be fixed(or we at least need to make it so Transaction conforms to EncodedTransaction)."
      const tx: any = algosdk.decodeSignedTransaction(buffer);
      return {
        txn: tx.txn,
        signed: true,
      };
    } else {
      throw new InvalidTransactionError('Transaction cannot be decoded');
    }
  }

  /**
   * Estimate the transaction byte size by signing it with a random hey and calculating the byte length
   *
   * @param txInfo {Object} required fields to build a multisig transaction
   * @returns {number} estimated byte size of the signed transaction
   */
  getTransactionByteSize(txInfo): number {
    // The txInfo for keyreg txes only contain the object for encoding with no metadata so we can't use the normal
    // createMultisigTransaction constructor because it will fail to construct the tx without the metadata. Since we
    // already have the object for encoding we can instead just estimate its size directly.
    if (!_.isUndefined(txInfo.objForEncoding)) {
      return txInfo.estimateSize();
    }

    const { fee = 1000 } = txInfo;
    const transaction = this.createMultisigTransaction(Object.assign({}, txInfo, { fee }));
    return transaction.estimateSize();
  }

  /**
   * Create a Multisig transaction object using Algorand SDK.
   *
   * @param txInfo {Object} required fields to build a multisig transaction
   * @returns {MultiSigTransaction} as defined in Algorand SDK
   */
  protected createMultisigTransaction(txInfo): any {
    const note = _.get(txInfo, 'note', '');
    const convertedNote = new Uint8Array(Buffer.from(note, 'utf-8'));
    const refinedTx = Object.assign({}, txInfo, { note: convertedNote });

    return new algosdk.Transaction(refinedTx);
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
   * secretKeyToMnemonic take an Algorant secret key and returns the corressponding mnemonic
   *
   * @param sk - Algorant secret key
   * @return Secret key is associated mnemonic
   */
  secretKeyToMnemonic(sk: Buffer) {
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
  seedFromMnemonic(mnemonic: string) {
    return algosdk.mnemonicToMasterDerivationKey(mnemonic);
  }

  /**
   * keyPairFromSeed generates an object with secretKey and publicKey using the algosdk
   * @param seed 32 bytes long seed
   * @returns { sk, pk } object with secretKey and publicKey
   */
  keyPairFromSeed(seed: Uint8Array) {
    const mn = this.mnemonicFromSeed(seed);
    const base64PrivateKey = algosdk.mnemonicToSecretKey(mn).sk;
    return this.decodePrivateKey(base64PrivateKey);
  }

  /**
   * decodePrivateKey get the secretKey and publicKey.
   * 
   * @param base64PrivateKey 64 bytes long privateKey
   * @returns { sk, pk } object with secretKey and publicKey
   */
  protected decodePrivateKey(base64PrivateKey: Uint8Array) {;
    const sk = base64PrivateKey.slice(0, 32);
    const pk = base64PrivateKey.slice(32);
    return { sk, pk };
  }

  /**
   * decodePrivateKey generates a seed with a mnemonic and using algosdk.
   *
   * @param seed 32 bytes long seed
   * @returns mnemonic - 25 words mnemonic - 25 words mnemonic
   */
  protected mnemonicFromSeed(seed: Uint8Array) {
    return algosdk.masterDerivationKeyToMnemonic(seed);
  }
}

const utils = new Utils();

export default utils;
