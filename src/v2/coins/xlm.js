const BaseCoin = require('../baseCoin');
const stellar = require('stellar-sdk');

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
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed) {
    const pair = seed ? stellar.Keypair.fromRawEd25519Seed(seed) : stellar.Keypair.random();
    return {
      pub: pair.rawPublicKey().toString('hex'),
      prv: pair.rawSecretKey().toString('hex')
    };
  }

  /**
   * Get decoded ed25519 public key from raw data
   *
   * @param pub {String} Raw public key
   * @returns {String} Encoded public key
   */
  getPubFromRaw(pub) {
    return stellar.Keypair.fromRawEd25519Seed(Buffer.from(pub, 'hex')).publicKey();
  }

  /**
   * Get decoded ed25519 private key from raw data
   *
   * @param prv {String} Raw private key
   * @returns {String} Encoded private key
   */
  getPrvFromRaw(prv) {
    return stellar.Keypair.fromRawEd25519Seed(Buffer.from(prv, 'hex')).secret();
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address) {
    return stellar.StrKey.isValidEd25519PublicKey(address);
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {String} secret the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidSecret(secret) {
    return stellar.StrKey.isValidEd25519SecretSeed(secret);
  }
}

module.exports = Xlm;
