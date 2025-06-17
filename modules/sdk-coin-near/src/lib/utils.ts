import bs58 from 'bs58';

import { BaseUtils, isBase58 } from '@bitgo/sdk-core';
import { coins, Nep141Token } from '@bitgo/statics';

import { KeyPair } from './keyPair';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return this.isValidAccountId(address);
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return isBase58(hash, 32);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    return this.isValidKey(key);
  }

  /** @inheritdoc */
  isValidPublicKey(pubKey: string): boolean {
    return this.isValidAccountId(pubKey);
  }

  /**
   * Check if the key have the correct format
   *
   * @param {string} key - string to be checked
   * @return {boolean} true if the string have the correct format otherwise return false
   */
  isValidKey(key: string): boolean {
    try {
      new KeyPair({ prv: key });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the account have the correct format
   *
   * @param {string} accountId - string to be checked
   * @return {boolean} if the string can have the correct format and match the expected length
   * or can create a new keyPair
   */
  isValidAccountId(accountId: string): boolean {
    return (
      (/^(([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+$/.test(accountId) &&
        accountId.length >= 2 &&
        accountId.length <= 64) ||
      isBase58(accountId, 32)
    );
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    return isBase58(signature, 64);
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return isBase58(txId, 32);
  }

  base58Encode(value: Uint8Array): string {
    return bs58.encode(value);
  }

  /**
   * Check if base58 decoded string is equal to length
   *
   * @param {string} value - string to be checked
   * @param {number} length - expected decoded length
   * @return {boolean} if the string can be decoded as base58 and match the expected length
   */
  isBase58(value: string, length: number): boolean {
    try {
      return !!value && bs58.decode(value).length === length;
    } catch (e) {
      return false;
    }
  }

  /**
   * Find the bitgo token name using contract address
   *
   * @param {String} contractAddress the token contract address
   * @returns {String} token name
   */
  findTokenNameFromContractAddress(contractAddress: string): string | undefined {
    const token = coins
      .filter((coin) => coin instanceof Nep141Token && coin.contractAddress === contractAddress)
      .map((coin) => coin as Nep141Token);
    return token ? token[0].name : undefined;
  }

  /**
   * Find the token instance using the bitgo token name
   *
   * @param {String} tokenName the bitgo name of the token
   * @returns {Nep141Token|undefined} token instance if found
   */
  getTokenInstanceFromTokenName(tokenName: string): Nep141Token | undefined {
    const token = coins
      .filter((coin) => coin instanceof Nep141Token && coin.name === tokenName)
      .map((coin) => coin as Nep141Token);
    return token ? token[0] : undefined;
  }
}

const utils = new Utils();

export default utils;
