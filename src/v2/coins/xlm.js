const _ = require('lodash');
const BigNumber = require('bignumber.js');
const querystring = require('querystring');
const url = require('url');
const Promise = require('bluebird');
const co = Promise.coroutine;

const BaseCoin = require('../baseCoin');
const stellar = require('stellar-base');

const maxMemoId = '0xFFFFFFFFFFFFFFFF'; // max unsigned 64-bit number = 18446744073709551615

class Xlm extends BaseCoin {

  constructor() {
    super();
    stellar.Network.use(new stellar.Network(stellar.Networks.PUBLIC));
  }
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
      pub: pair.publicKey(),
      prv: pair.secret()
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
    return stellar.StrKey.isValidEd25519PublicKey(pub);
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv) {
    return stellar.StrKey.isValidEd25519SecretSeed(prv);
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

    return (memoId.gte(0) && memoId.lt(maxMemoId));
  }

  /**
   * Process address into address and memo id
   *
   * @param address {String} the address
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
   * Check if address is a valid XLM address, and then make sure it matches the root address.
   *
   * @param address {String} the address to verify
   * @param rootAddress {String} the wallet's root address
   */
  verifyAddress({ address, rootAddress }) {
    if (!this.isValidAddress(address)) {
      throw new Error(`invalid address: ${address}`);
    }

    const addressDetails = this.getAddressDetails(address);
    const rootAddressDetails = this.getAddressDetails(rootAddress);

    if (addressDetails.address !== rootAddressDetails.address) {
      throw new Error(`address validation failure: ${addressDetails.address} vs ${rootAddressDetails.address}`);
    }
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   */
  signTransaction(params) {
    const { txPrebuild, prv } = params;

    if (_.isUndefined(txPrebuild)) {
      throw new Error('missing txPrebuild parameter');
    }
    if (!_.isObject(txPrebuild)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
    }

    if (_.isUndefined(prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }
    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    const keyPair = stellar.Keypair.fromSecret(prv);
    const tx = new stellar.Transaction(txPrebuild.txBase64);
    tx.sign(keyPair);

    return {
      halfSigned: {
        txBase64: tx.toEnvelope().toXDR('base64')
      }
    };
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
        if (!this.isValidPrv(rootPrv)) {
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
    if (!this.isValidPrv(key.prv)) {
      throw new Error(`invalid prv: ${key.prv}`);
    }
    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message);
    }
    const keypair = stellar.Keypair.fromSecret(key.prv);
    return keypair.sign(message);
  }

  /**
   * Verifies if signature for message is valid.
   *
   * @param pub {String} public key
   * @param message {Buffer|String} signed message
   * @param signature {Buffer} signature to verify
   * @returns {Boolean} true if signature is valid.
   */
  verifySignature(pub, message, signature) {
    if (!this.isValidPub(pub)) {
      throw new Error(`invalid pub: ${pub}`);
    }
    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message);
    }
    const keyPair = stellar.Keypair.fromPublicKey(pub);
    return keyPair.verify(message, signature);
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   *
   * @param txParams {Object} params object passed to send
   * @param txPrebuild {Object} prebuild object returned by platform
   * @param txPrebuild.txBase64 {String} prebuilt transaction encoded as base64 string
   * @param wallet {Wallet} wallet object to obtain keys to verify against
   * @param verification Object specifying some verification parameters
   * @param verification.disableNetworking Disallow fetching any data from the internet for verification purposes
   * @param verification.keychains Pass keychains manually rather than fetching them by id
   * @param callback
   * @returns {boolean}
   */
  verifyTransaction({ txParams, txPrebuild, wallet, verification = {} }, callback) {
    // TODO BG-5600 Add parseTransaction / improve verification
    return co(function *() {
      const disableNetworking = !!verification.disableNetworking;

      const tx = new stellar.Transaction(txPrebuild.txBase64);
      // Stellar txs are made up of operations. We only care about Create Account and Payment for sending funds.
      const outputOperations = _.filter(tx.operations, operation =>
        operation.type === 'createAccount' || operation.type === 'payment'
      );

      if (outputOperations.length !== 1) {
        throw new Error('transaction prebuild should have exactly 1 recipient');
      }

      const expectedOutput = txParams.recipients[0];
      const expectedOutputAddress = this.getAddressDetails(expectedOutput.address);
      const output = outputOperations[0];

      if (output.destination !== expectedOutputAddress.address) {
        throw new Error('transaction prebuild does not match expected recipient');
      }

      const expectedOutputAmount = new BigNumber(expectedOutput.amount);
      // The output amount is expressed as startingBalance in createAccount operations and as amount in payment operations.
      let outputAmount = (output.type === 'createAccount') ? output.startingBalance : output.amount;
      outputAmount = new BigNumber(this.bigUnitsToBaseUnits(outputAmount));

      if (!outputAmount.eq(expectedOutputAmount)) {
        throw new Error('transaction prebuild does not match expected amount');
      }

      // Verify the user signature, if the tx is half-signed
      if (!_.isEmpty(tx.signatures)) {
        const userSignature = tx.signatures[0].signature();

        // obtain the keychains and key signatures
        let keychains = verification.keychains;
        if (!keychains && disableNetworking) {
          throw new Error('cannot fetch keychains without networking');
        } else if (!keychains) {
          keychains = yield Promise.props({
            user: this.keychains().get({ id: wallet._wallet.keys[0] }),
            backup: this.keychains().get({ id: wallet._wallet.keys[1] }),
            bitgo: this.keychains().get({ id: wallet._wallet.keys[2] })
          });
        }

        if (this.verifySignature(keychains.backup.pub, tx.hash(), userSignature)) {
          throw new Error('transaction signed with wrong key');
        }
        if (!this.verifySignature(keychains.user.pub, tx.hash(), userSignature)) {
          throw new Error('transaction signature invalid');
        }
      }

      return true;
    }).call(this).asCallback(callback);
  }
}

module.exports = Xlm;
