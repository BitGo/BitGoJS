import BaseCoin = require('../baseCoin');
const algosdk = require('algosdk');

interface KeyPair {
  pub: string;
  prv: string;
}

class Algo extends BaseCoin {
  constructor() {
    super();
  }

  getChain(): string {
    return 'algo';
  }

  getFamily(): string {
    return 'algo';
  }

  getFullName(): string {
    return 'Algorand';
  }

  getBaseFactor(): number {
    return 1e6;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    // TODO: this sounds like its true with the staking txes - confirm before launch
    return false;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const pair = seed ? algosdk.generateAccountFromSeed(seed) : algosdk.generateAccount();
    return {
      pub: pair.addr, // encoded pub
      prv: algosdk.Seed.encode(pair.sk), // encoded seed
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub): boolean {
    return algosdk.isValidAddress(pub);
  }

  /**
   * Return boolean indicating whether input is valid seed for the coin
   * In Algorand, when the private key is encoded as base32 string only the first 32 bytes are taken,
   * so the encoded value is actually the seed
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv): boolean {
    return algosdk.isValidSeed(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address): boolean {
    return algosdk.isValidAddress(address);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key, message): Buffer {
    // key.prv actually holds the encoded seed, but we use the prv name to avoid breaking the keypair schema.
    // See jsdoc comment in isValidPrv
    let seed = key.prv;
    if (!this.isValidPrv(seed)) {
      throw new Error(`invalid seed: ${seed}`);
    }
    if (typeof seed === 'string') {
      try {
        seed = algosdk.Seed.decode(seed).seed;
      } catch (e) {
        throw new Error(`could not decode seed: ${seed}`);
      }
    }
    const keyPair = algosdk.generateAccountFromSeed(seed);

    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message);
    }

    return Buffer.from(algosdk.NaclWrapper.sign(message, keyPair.sk));
  }
}

export default Algo;
