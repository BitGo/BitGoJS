import {
  bigIntToHex,
  BlsKeyPair,
  BlsKeys,
  isValidBLSPrivateKey,
  isValidBLSPublicKey,
  KeyPairOptions,
} from '@bitgo/sdk-core';

/**
 * Ethereum keys and address management.
 */
export class KeyPair extends BlsKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   */
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /**
   * ETH2 default keys format is a pair of Uint8Array keys
   *
   * @returns { BlsKeys } The keys in the defined format
   */
  getKeys(): BlsKeys {
    if (this.keyPair) {
      return this.keyPair;
    }
    throw new Error('Error getting keys. Check keyPair has been specified & private key is valid');
  }

  /**
   * Whether input is a valid BLS public key
   *
   * @param {string} pub the public key to validate
   * @returns {boolean} Whether input is a valid public key or not
   */
  static isValidPub(pub: string): boolean {
    return isValidBLSPublicKey(pub);
  }

  /**
   * Whether the input is a valid BLS private key
   *
   * @param {string | Buffer | bigint} prv a private key to validate
   * @returns {boolean} Whether the input is a valid private key or not
   */
  static isValidPrv(prv: string | Buffer | bigint): boolean {
    if (typeof prv === 'string') {
      return isValidBLSPrivateKey(prv);
    }
    if (typeof prv === 'bigint') {
      return isValidBLSPrivateKey(bigIntToHex(prv));
    }
    try {
      const hexPrv = Array.from(prv)
        .map(function (val) {
          const hex = val.toString(16);
          return '0'.slice(0, hex.length % 2) + hex;
        })
        .join('');
      return isValidBLSPrivateKey(hexPrv);
    } catch (e) {
      return false;
    }
  }
}
