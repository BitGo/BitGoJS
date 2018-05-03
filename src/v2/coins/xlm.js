const BigNumber = require('bignumber.js');
const url = require('url');
const querystring = require('querystring');
const Promise = require('bluebird');
const co = Promise.coroutine;

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
    return stellar.StrKey.encodeEd25519PublicKey(Buffer.from(pub, 'hex'));
  }

  /**
   * Get decoded ed25519 private key from raw data
   *
   * @param prv {String} Raw private key
   * @returns {String} Encoded private key
   */
  getPrvFromRaw(prv) {
    return stellar.StrKey.encodeEd25519SecretSeed(Buffer.from(prv, 'hex'));
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub) {
    // WARNING: An encoded prv key could still be considered a valid pub
    return stellar.StrKey.isValidEd25519PublicKey(this.getPubFromRaw(pub));
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv) {
    return stellar.StrKey.isValidEd25519SecretSeed(this.getPrvFromRaw(prv));
  }

  /**
   * Return boolean indicating whether a memo id is valid
   *
   * @param memoId {String} memo id
   * @returns {boolean} true if memo id is valid
   */
  isValidMemoId(memoId) {
    try {
      memoId = new BigNumber(memoId);
    } catch (e) {
      return false;
    }

    const maxUnsigned64BitNumber = '0xFFFFFFFFFFFFFFFF'; // 18446744073709551615
    return (memoId.greaterThan(0) && memoId.lessThan(maxUnsigned64BitNumber));
  }

  /**
   * Process address into address and memo id
   *
   * @param address {String}
   * @returns {Object} object containing address and memo id
   */
  getAddressDetails(address) {
    const destinationDetails = url.parse(address);
    const queryDetails = querystring.parse(destinationDetails.query);
    const destinationAddress = destinationDetails.pathname;
    if (!stellar.StrKey.isValidEd25519PublicKey(destinationAddress)) {
      throw new Error(`invalid address: ${address}`);
    }
    // address doesn't have a memo id
    if (destinationDetails.pathname === address) {
      return {
        address: address,
        memoId: null
      };
    }

    if (!queryDetails.memoId) {
      // if there are more properties, the query details need to contain the memo id property
      throw new Error(`invalid address: ${address}`);
    }

    let memoId;
    try {
      memoId = new BigNumber(queryDetails.memoId);
    } catch (e) {
      throw new Error(`invalid address: ${address}`);
    }

    if (!this.isValidMemoId(memoId)) {
      throw new Error(`invalid address: ${address}`);
    }

    return {
      address: destinationAddress,
      memoId: memoId.toFixed(0)
    };
  }

  /**
   * Validate and return address with appended memo id
   *
   * @param address {String} address
   * @param memoId {String} memo id
   * @returns {String} address with memo id
   */
  normalizeAddress({ address, memoId }) {
    if (!stellar.StrKey.isValidEd25519PublicKey(address)) {
      throw new Error(`invalid address details: ${address}`);
    }
    if (this.isValidMemoId(memoId)) {
      return `${address}?memoId=${memoId}`;
    }
    return address;
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address) {
    try {
      const addressDetails = this.getAddressDetails(address);
      return address === this.normalizeAddress(addressDetails);
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if address is a valid XLM address
   *
   * @param address {String} the address to verify
   */
  verifyAddress({ address }) {
    if (!this.isValidAddress(address)) {
      throw new Error(`invalid address: ${address}`);
    }
  }

  /**
   * Extend walletParams with extra params required for generating an XLM wallet
   *
   * @param walletParams {Object}
   */
  supplementGenerateWallet(walletParams) {
    return co(function *() {
      // initially, we need a random root prv to generate the account, which has to be distinct from all three keychains
      // generated by the platform
      let seed;
      const rootPrv = walletParams.rootPrivateKey;
      if (rootPrv) {
        if (!this.isValidSecret(rootPrv)) {
          throw new Error('rootPrivateKey needs to be a private key hex');
        }
        seed = Buffer.from(rootPrv, 'hex');
      }
      const keyPair = this.generateKeyPair(seed);
      // extend the wallet initialization params
      walletParams.rootPrivateKey = keyPair.prv;
      return walletParams;
    }).call(this);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key, message) {
    const seed = Buffer.from(key.prv, 'hex');
    const keypair = stellar.Keypair.fromRawEd25519Seed(seed);
    return keypair.sign(message);
  }
}

module.exports = Xlm;
