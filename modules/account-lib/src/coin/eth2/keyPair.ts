import { BlsKeyPair } from '../baseCoin/blsKeyPair';
import { DefaultKeys } from '../baseCoin/iface';
import * as testData from '../../../test/resources/eth2/eth2';

/**
 * Ethereum keys and address management.
 */
export class KeyPair extends BlsKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   */
  constructor() {
    super();
  }

  /**
   * ETH2 default keys format is a pair of Uint8Array keys
   *
   * @returns { DefaultKeys } The keys in the defined format
   */
  getKeys(): DefaultKeys {
    if (this.keyPair) {
      return { prv: this.keyPair.privateKey.toHexString(), pub: this.keyPair.publicKey.toHexString() };
    }
    throw new Error('Error geting keys. Check keyPair has been specified & privae key is valid');
  }

  /**
   * Get an Ethereum public address
   *
   * @returns {string} The address derived from the public key
   */
  getAddress(): string {
    return this.getKeys().pub;
  }

  static isValidPub(pub: string): boolean {
    return BlsKeyPair.isValidBLSPub(pub);
  }

  static isValidPrv(prv: string | Buffer) {
    if (typeof prv === 'string') {
      return BlsKeyPair.isValidBLSPrv(prv);
    }
    try {
      prv = '0x' + Buffer.from(prv).toString('hex');
      return BlsKeyPair.isValidBLSPrv(prv);
    } catch (e) {
      return false;
    }
  }
}
