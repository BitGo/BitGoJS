import { BaseUtils } from '@bitgo/sdk-core/src/account-lib/baseCoin';
import { NotImplementedError } from '@bitgo/sdk-core/src/account-lib/baseCoin/errors';
import { isValidXprv, isValidXpub } from '@bitgo/sdk-core';
import { ec } from 'elliptic';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    throw new NotImplementedError('isValidAddress not implemented');
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new NotImplementedError('isValidBlockId not implemented');
  }

  /**
   * Checks if the string is a valid protocol public key or
   * extended public key.
   *
   * @param {string} pub - the  public key to be validated
   * @returns {boolean} - the validation result
   */
  isValidPublicKey(pub: string): boolean {
    if (isValidXpub(pub)) return true;

    if (pub.length !== 66 && pub.length !== 130) return false;

    const firstByte = pub.slice(0, 2);

    // uncompressed public key
    if (pub.length === 130 && firstByte !== '04') return false;

    // compressed public key
    if (pub.length === 66 && firstByte !== '02' && firstByte !== '03') return false;

    if (!this.allHexChars(pub)) return false;

    // validate the public key
    const secp256k1 = new ec('secp256k1');
    try {
      const keyPair = secp256k1.keyFromPublic(Buffer.from(pub, 'hex'));
      const { result } = keyPair.validate();
      return result;
    } catch (e) {
      return false;
    }
  }

  /**
   * Checks if the string is a valid protocol private key, or extended
   * private key.
   *
   * @param {string} prv - the private key (or extended private key) to be validated
   * @returns {boolean} - the validation result
   */
  isValidPrivateKey(prv: string): boolean {
    if (isValidXprv(prv)) return true;

    if (prv.length !== 64 && prv.length !== 66) return false;

    if (prv.length === 66 && prv.slice(64) !== '01') return false;

    return this.allHexChars(prv);
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('isValidSignature not implemented');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new NotImplementedError('isValidTransactionId not implemented');
  }

  /**
   * Returns whether or not the string is a composed of hex chars only
   *
   * @param {string} maybe - the  string to be validated
   * @returns {boolean} - the validation result
   */
  allHexChars(maybe: string): boolean {
    return /^([0-9a-f])+$/i.test(maybe);
  }
}

const utils = new Utils();

export default utils;
