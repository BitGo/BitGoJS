const BaseCoin = require('../baseCoin');
const crypto = require('crypto');
const prova = require('prova-lib');

class Ofc extends BaseCoin {

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
    const extendedKey = prova.HDNode.fromSeedBuffer(seed);
    const xpub = extendedKey.neutered().toBase58();
    return {
      pub: xpub,
      prv: extendedKey.toBase58()
    };
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
}

module.exports = Ofc;
