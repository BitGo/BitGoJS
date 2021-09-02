import * as bip32 from 'bip32';
import * as _ from 'lodash';
import { RippleAPI } from 'ripple-lib';
import * as RippleAddressCodec from 'ripple-address-codec';
import { verify } from 'ripple-keypairs';
import { BaseUtils } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';

export const initApi = (): RippleAPI => new RippleAPI({});
export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    if (RippleAddressCodec.isValidClassicAddress(address) || RippleAddressCodec.isValidXAddress(address)) {
      return true;
    }
    return false;
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    try {
      bip32.fromBase58(key).toWIF();
      return true;
    } catch (e) {
      return false;
    }
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    try {
      return bip32.fromBase58(key).isNeutered();
    } catch (e) {
      return false;
    }
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('method not implemented');
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

  /**
   * Verifies a signed message
   *
   * The signature must be hex characters
   * https://github.com/ripple/ripple-keypairs
   *
   * @param {string} message - message to verify the signature
   * @param {string} signature - signature to verify
   * @param {string} publicKey - public key as hex string used to verify the signature
   * @returns {boolean} - verification result
   */
  verifySignature(message: string, signature: string, publicKey: string): boolean {
    if (!this.allHexChars(signature)) return false;
    if (_.isEmpty(message)) return false;
    return verify(message, signature, publicKey);
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new NotImplementedError('method not implemented');
  }
}

export default new Utils();
