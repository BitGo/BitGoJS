const baseCoinPrototype = require('../baseCoin').prototype;
const stellar = require('../../stellar');

const Xlm = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
};

Xlm.prototype = Object.create(baseCoinPrototype);
Xlm.constructor = Xlm;

/**
 * Returns the factor between the base unit and its smallest subdivison
 * @return {number}
 */
Xlm.prototype.getBaseFactor = function() {
  return 1e7;
};

Xlm.prototype.getChain = function() {
  return 'xlm';
};
Xlm.prototype.getFamily = function() {
  return 'xlm';
};

Xlm.prototype.getFullName = function() {
  return 'Stellar';
};

/**
 * Generate secp256k1 key pair
 *
 * @param seed
 * @returns {Object} object with generated pub and prv
 */
Xlm.prototype.generateKeyPair = function(seed) {
  const pair = seed ? stellar.makeKeyFromSeed(seed) : stellar.makeRandomKey();
  return {
    pub: pair.publicKey(),
    prv: pair.secret()
  };
};

module.exports = Xlm;
