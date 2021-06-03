import crypto from 'crypto';
import algosdk from 'algosdk';
import * as hex from '@stablelib/hex';
import base32 from 'hi-base32';
import { isValidEd25519PublicKey, isValidEd25519SecretKey } from '../../utils/crypto';
import { BaseUtils } from '../baseCoin';
import { InvalidKey, NotImplementedError } from '../baseCoin/errors';

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
}

const utils = new Utils();

export default utils;
