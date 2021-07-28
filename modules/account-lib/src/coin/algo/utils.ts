import crypto from 'crypto';
import algosdk from 'algosdk';
import stellar from 'stellar-sdk';
import * as hex from '@stablelib/hex';
import base32 from 'hi-base32';
import _ from 'lodash';
import { isValidEd25519PublicKey, isValidEd25519SecretKey } from '../../utils/crypto';
import { BaseUtils } from '../baseCoin';
import { InvalidKey, NotImplementedError, InvalidTransactionError } from '../baseCoin/errors';
import { EncodedTx, BaseAddress } from './ifaces';
import { KeyPair } from './keyPair';

const ALGORAND_CHECKSUM_BYTE_LENGTH = 4;
const ALGORAND_ADDRESS_LENGTH = 58;
const ALGORAND_MINIMUM_FEE = 1000;

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

    const { fee = 1 } = txInfo;
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
   * createKeyPair generet the new objet keyPair.
   *
   * @param base64PrivateKey 64 bytes long privateKey
   * @returns KeyPair
   */
  protected createKeyPair(base64PrivateKey: Uint8Array): KeyPair {
    const sk = base64PrivateKey.slice(0, 32);
    const keyPair = new KeyPair({ prv: Buffer.from(sk).toString('hex') });
    return keyPair;
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
   * isValidEd25519PublicKeyStellar validate the key with the stellar-sdk
   *
   * @param publicKey
   * @returns booldean
   */
  protected isValidEd25519PublicKeyStellar(publicKey: string): boolean {
    return stellar.StrKey.isValidEd25519PublicKey(publicKey);
  }

  /**
   * decodeEd25519PublicKeyStellar decode the key with the stellar-sdk
   *
   * @param publicKey
   * @returns booldean
   */
  protected decodeEd25519PublicKeyStellar(publicKey: string): Buffer {
    return stellar.StrKey.decodeEd25519PublicKey(publicKey);
  }

  /**
   * encodeAddress return an addres encoding with algosdk
   *
   * @param addr
   * @returns string
   */
  encodeAddress(addr: Buffer): string {
    return algosdk.encodeAddress(addr);
  }

  /**
   *stellarAddressToAlgoAddress returns an address algo of algo
   *if is sent an xmlAddress if it does not return the same address.
   *
   * @param addressOrPubKey
   * @returns address algo string
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
   * Build correct fee info and fee rate for Algorand transactions.
   *
   // eslint-disable-next-line jsdoc/require-param-type
   * @param tx {Object} required fields or building fee info.
   * @param feeRate {number} required fee rate for building fee info.
   * @returns {Object} The fee information for algorand txn.
   */
  getFeeData(tx, feeRate: number): any {
    const size = this.getTransactionByteSize(tx);
    let feeInfo = this.validateFeeInfo(size, { feeRate: feeRate, fee: undefined, baseFactor: 1 });
    if (feeInfo.fee < ALGORAND_MINIMUM_FEE) {
      feeInfo = this.validateFeeInfo(size, { feeRate: undefined, fee: ALGORAND_MINIMUM_FEE, baseFactor: 1 });
      feeRate = feeInfo.feeRate;
    }
    return { feeInfo, feeRate };
  }

  /**
   * multisigAddress takes multisig metadata (preimage) and returns the corresponding human readable Algorand address.
   *
   * @param {number} version mutlisig version
   * @param {number} threshold multisig threshold
   * @param {string} addrs list of Algorand addresses
   * @returns {string} human readable Algorand address.
   */
  multisigAddress(version: number, threshold: number, addrs: string): string {
    return algosdk.multisigAddress({
      version,
      threshold,
      addrs,
    });
  }

  /**
   * Check values for feeInfo building
   *
   * @param size {number} required size to check.
   * @param feeData {Object} required fees to check.
   * @returns {Object} with fee data validated.
   */
  protected validateFeeInfo(size: number, { feeRate, fee, baseFactor = 1000 }): any {
    if (!Number.isSafeInteger(size) || size < 0) {
      throw new Error('Size must be integer positive number');
    }
    if (_.isUndefined(feeRate) && _.isUndefined(fee)) {
      throw new Error('Fee rate or fee are missed');
    }
    let fee_value, fee_rate;
    if (!_.isUndefined(feeRate)) {
      if (!Number.isSafeInteger(feeRate) || feeRate < 0) {
        throw new Error('FeeRate must be integer positive number');
      }
      fee_rate = feeRate;
      fee_value = Math.ceil((fee_rate * size) / baseFactor);
    } else {
      if (!Number.isSafeInteger(fee) || fee < 0) {
        throw new Error('Fee must be integer positive number');
      }
      fee_value = fee;
      fee_rate = Math.round((fee / size) * baseFactor);
    }
    const feeObj = {
      feeRate: fee_rate,
      fee: fee_value,
      size: size,
    };

    return feeObj;
  }
}

const utils = new Utils();

export default utils;
