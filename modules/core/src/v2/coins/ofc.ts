import { BaseCoin } from '../baseCoin';
import * as crypto from 'crypto';
import * as bitGoUtxoLib from 'bitgo-utxo-lib';
import * as errors from '../../errors';

export class Ofc extends BaseCoin {

  static createInstance(bitgo: any): BaseCoin {
    return new Ofc(bitgo);
  }

  getChain() {
    return 'ofc';
  }

  /**
   * Generate secp256k1 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed) {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = crypto.randomBytes(512 / 8);
    }
    const extendedKey = bitGoUtxoLib.HDNode.fromSeedBuffer(seed);
    const xpub = extendedKey.neutered().toBase58();
    return {
      pub: xpub,
      prv: extendedKey.toBase58()
    };
  }

  getFamily() {
    return 'ofc';
  }

  getFullName() {
    return 'Offchain';
  }

  /**
   * Return whether the given m of n wallet signers/ key amounts are valid for the coin
   */
  isValidMofNSetup({ m, n }) {
    return m === 1 && n === 1;
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub) {
    try {
      bitGoUtxoLib.HDNode.fromBase58(pub);
      return true;
    } catch (e) {
      return false;
    }
  }

  isValidAddress(address: string): boolean {
    throw new errors.MethodNotImplementedError();
  }
}
