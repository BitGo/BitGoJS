import algosdk from 'algosdk';
import { isValidEd25519PublicKey, isValidEd25519SecretKey } from '../../utils/crypto';
import { BaseUtils } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';

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
}

const utils = new Utils();

export default utils;
