import crypto from 'crypto';
import algosdk from 'algosdk';
import * as hex from '@stablelib/hex';
import base32 from 'hi-base32';
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
}

const utils = new Utils();

export default utils;
