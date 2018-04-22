const BaseCoin = require('../baseCoin');
const stellar = require('../../stellar');

class Xlm extends BaseCoin {

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor() {
    return 1e7;
  }

  getChain() {
    return 'xlm';
  }
  getFamily() {
    return 'xlm';
  }

  getFullName() {
    return 'Stellar';
  }

  /**
   * Generate secp256k1 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed) {
    const pair = seed ? stellar.makeKeyFromSeed(seed) : stellar.makeRandomKey();
    return {
      pub: pair.publicKey(),
      prv: pair.secret()
    };
  }

}

module.exports = Xlm;
