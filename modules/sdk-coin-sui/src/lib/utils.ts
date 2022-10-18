import { BaseUtils, BuildTransactionError, ParseTransactionError } from '@bitgo/sdk-core';
import { bcs } from '@mysten/bcs';
import BigNumber from 'bignumber.js';
import { TYPE_TAG } from './transaction';

export const SUI_ADDRESS_LENGTH = 20;

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Checks if raw transaction can be deserialized
   *
   * @param {string} rawTransaction - transaction in base64 string format
   * @returns {boolean} - the validation result
   */
  isValidRawTransaction(rawTransaction: string): boolean {
    try {
      const data = Buffer.from(rawTransaction, 'hex');
      const trimmedData = new Uint8Array(data.subarray(TYPE_TAG.length));
      const deserialized = bcs.de('TransactionData', trimmedData);
      bcs.ser('TransactionData', deserialized);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {string} rawTransaction - Transaction in base64 string  format
   */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    if (!this.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /**
   * Validates addresses to check if all exist and are valid Sui public keys
   *
   * @param {string} addresses The address to be validated
   * @param {string} fieldName Name of the field to validate, its needed to return which field is failing on case of error.
   */
  validateAddresses(addresses: string[], fieldName: string): void {
    for (const address of addresses) {
      this.validateAddress(address, fieldName);
    }
  }

  /**
   * Validates address to check if it exists and is a valid Sui public key
   *
   * @param {string} address The address to be validated
   * @param {string} fieldName Name of the field to validate, its needed to return which field is failing on case of error.
   */
  validateAddress(address: string, fieldName: string): void {
    if (!address || !this.isValidAddress(address)) {
      throw new BuildTransactionError(`Invalid or missing ${fieldName}, got: ${address}`);
    }
  }

  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return this.isHex(address) && this.getHexByteLength(address) === SUI_ADDRESS_LENGTH;
  }

  isHex(value: string): boolean {
    return /^(0x|0X)?[a-fA-F0-9]+$/.test(value) && value.length % 2 === 0;
  }

  getHexByteLength(value: string): number {
    return /^(0x|0X)/.test(value) ? (value.length - 2) / 2 : value.length / 2;
  }

  /**
   * Returns whether or not the string is a valid amount
   *
   * @param {number[]} amounts - the amounts to validate
   * @returns {boolean} - the validation result
   */
  isValidAmounts(amounts: number[]): boolean {
    for (const amount of amounts) {
      if (!this.isValidAmount(amount)) {
        return false;
      }
    }
    return true;
  }

  isValidAmount(amount: number): boolean {
    const bigNumberAmount = new BigNumber(amount);
    if (!bigNumberAmount.isInteger() || bigNumberAmount.isLessThanOrEqualTo(0)) {
      return false;
    }
    return true;
  }
}

const utils = new Utils();

export default utils;
