import * as BLS from '@bitgo/bls';
import { BaseKeyPair } from './baseKeyPair';
import { AddressFormat } from './enum';
import { NotImplementedError } from './errors';

let initialized = false;
const initialize = async () => {
  await BLS.initBLS();
  initialized = true;
};

setImmediate(async () => {
  await initialize();
});

function ensureInitialized() {
  if (!initialized) {
    throw new Error('BLS lib not yet initialized, please retry');
  }
}

/**
 * Base class for BLS keypairs.
 */
export abstract class BlsKeyPair implements BaseKeyPair {
  protected keyPair: BLS.Keypair;

  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   */
  protected constructor() {
    ensureInitialized();
    this.keyPair = BLS.generateKeyPair();
  }

  /**
   * Build a keyPair from private key.
   *
   * @param {string} prv a hexadecimal private key
   */
  recordKeysFromPrivateKey(prv: string) {
    if (BlsKeyPair.isValidBLSPrv(prv)) {
      const privateKey = BLS.PrivateKey.fromHexString(prv);
      this.keyPair = new BLS.Keypair(privateKey);
    } else {
      throw new Error('Invalid private key');
    }
  }

  /**
   * Note - this is not possible using BLS. BLS does not support pubkey derived key gen
   *
   * @param {string} pub - An extended, compressed, or uncompressed public key
   */
  recordKeysFromPublicKey(pub: string): void {
    throw new NotImplementedError('Public key derivation is not supported in bls');
  }

  getAddress(format?: AddressFormat): string {
    throw new NotImplementedError('getAddress not implemented');
  }

  getKeys(): any {
    throw new NotImplementedError('getKeys not implemented');
  }

  /**
   * Whether the input is a valid BLS private key
   *
   * @param {string} prv A hexadecimal public key to validate
   * @returns {boolean} Whether the input is a valid private key or not
   */
  public static isValidBLSPrv(prv: string): boolean {
    ensureInitialized();
    try {
      BLS.PrivateKey.fromHexString(prv);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {string} pub the pub to be checked
   * @returns {boolean} is it valid?
   */
  public static isValidBLSPub(pub: string): boolean {
    ensureInitialized();
    try {
      BLS.PublicKey.fromHex(pub);
      return true;
    } catch (e) {
      return false;
    }
  }

  public static aggregatePubkeys(pubKeys: Uint8Array[]): Buffer {
    ensureInitialized();
    try {
      return BLS.aggregatePubkeys(pubKeys);
    } catch (e) {
      throw new Error('Error aggregating pubkeys: ' + e);
    }
  }
}
