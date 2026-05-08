import { AddressFormat } from './enum';

/**
 * Base keys and address management.
 */
export interface BaseKeyPair {
  /**
   * Build a set of keys from a prv
   *
   * @param {string} prv A raw private key
   */
  recordKeysFromPrivateKey(prv: string): void;

  /**
   * Build a set of keys from a pub
   *
   * @param {string} pub A raw pub key
   */
  recordKeysFromPublicKey(pub: string): void;

  /**
   * Returns the keys in the protocol default key format
   */
  getKeys(): any;

  /**
   * Returns the address in the protocol default format
   */
  getAddress(format?: AddressFormat): string;
}
