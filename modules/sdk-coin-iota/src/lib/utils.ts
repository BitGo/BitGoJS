import { BaseUtils, isValidEd25519PublicKey, isValidEd25519SecretKey, isBase58 } from '@bitgo/sdk-core';
import {
  IOTA_ADDRESS_LENGTH,
  IOTA_BLOCK_DIGEST_LENGTH,
  IOTA_SIGNATURE_LENGTH,
  IOTA_TRANSACTION_DIGEST_LENGTH,
} from './constants';
import { Ed25519PublicKey } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction as IotaTransaction } from '@iota/iota-sdk/transactions';
import { toBase64, fromBase64 } from '@iota/iota-sdk/utils';

/**
 * Utility class for IOTA-specific validation and conversion operations.
 * Implements the BaseUtils interface and provides methods for validating
 * addresses, keys, signatures, and transaction data.
 */
export class Utils implements BaseUtils {
  // ========================================
  // Address and ID Validation
  // ========================================

  /**
   * Validates an IOTA address format.
   * IOTA addresses are 64-character hex strings prefixed with '0x'.
   *
   * @param address - The address to validate
   * @returns true if the address is valid
   *
   * @example
   * ```typescript
   * utils.isValidAddress('0x1234...') // true
   * utils.isValidAddress('invalid') // false
   * ```
   */
  isValidAddress(address: string): boolean {
    return this.isValidHex(address, IOTA_ADDRESS_LENGTH);
  }

  /**
   * Validates an IOTA block ID (digest).
   * Block IDs are 32-byte base58-encoded strings.
   *
   * @param hash - The block ID to validate
   * @returns true if the block ID is valid
   */
  isValidBlockId(hash: string): boolean {
    return isBase58(hash, IOTA_BLOCK_DIGEST_LENGTH);
  }

  /**
   * Validates an IOTA transaction ID (digest).
   * Transaction IDs are 32-byte base58-encoded strings.
   *
   * @param txId - The transaction ID to validate
   * @returns true if the transaction ID is valid
   */
  isValidTransactionId(txId: string): boolean {
    return isBase58(txId, IOTA_TRANSACTION_DIGEST_LENGTH);
  }

  // ========================================
  // Key Validation
  // ========================================

  /**
   * Validates an Ed25519 private key format.
   *
   * @param key - The private key to validate (hex string)
   * @returns true if the private key is valid
   */
  isValidPrivateKey(key: string): boolean {
    return isValidEd25519SecretKey(key);
  }

  /**
   * Validates an Ed25519 public key format.
   *
   * @param key - The public key to validate (hex string)
   * @returns true if the public key is valid
   */
  isValidPublicKey(key: string): boolean {
    return isValidEd25519PublicKey(key);
  }

  // ========================================
  // Signature and Transaction Validation
  // ========================================

  /**
   * Validates an IOTA signature format.
   * Signatures must be base64-encoded and exactly 64 bytes when decoded.
   *
   * @param signature - The base64-encoded signature to validate
   * @returns true if the signature is valid
   */
  isValidSignature(signature: string): boolean {
    try {
      const decodedSignature = fromBase64(signature);
      return decodedSignature.length === IOTA_SIGNATURE_LENGTH;
    } catch (error) {
      // Invalid base64 or decoding error
      return false;
    }
  }

  /**
   * Validates a raw IOTA transaction format.
   * Attempts to parse the transaction using the IOTA SDK.
   *
   * @param rawTransaction - The raw transaction (base64 string or Uint8Array)
   * @returns true if the transaction can be parsed
   */
  isValidRawTransaction(rawTransaction: string | Uint8Array): boolean {
    try {
      IotaTransaction.from(rawTransaction);
      return true;
    } catch (error) {
      return false;
    }
  }

  // ========================================
  // Conversion and Utility Methods
  // ========================================

  /**
   * Validates a hex string with a specific length requirement.
   * Checks for '0x' or '0X' prefix followed by the specified number of hex characters.
   *
   * @param value - The hex string to validate
   * @param length - The required length (number of hex characters, excluding prefix)
   * @returns true if the hex string matches the format and length
   */
  isValidHex(value: string, length: number): boolean {
    const regex = new RegExp(`^(0x|0X)[a-fA-F0-9]{${length}}$`);
    return regex.test(value);
  }

  /**
   * Converts a value to a base64-encoded string.
   * Handles both Uint8Array and hex string inputs.
   *
   * @param value - The value to encode (Uint8Array or hex string)
   * @returns Base64-encoded string
   *
   * @example
   * ```typescript
   * utils.getBase64String(new Uint8Array([1, 2, 3]))
   * utils.getBase64String('0x010203')
   * ```
   */
  getBase64String(value: string | Uint8Array): string {
    if (value instanceof Uint8Array) {
      return toBase64(value);
    }
    return toBase64(Buffer.from(value, 'hex'));
  }

  /**
   * Derives an IOTA address from an Ed25519 public key.
   * Uses the IOTA SDK's address derivation algorithm.
   *
   * @param publicKey - The Ed25519 public key (hex string)
   * @returns The derived IOTA address
   *
   * @example
   * ```typescript
   * const address = utils.getAddressFromPublicKey('8c26e54e36c902c5...')
   * // Returns: '0x9882188ba3e8070a...'
   * ```
   */
  getAddressFromPublicKey(publicKey: string): string {
    const iotaPublicKey = new Ed25519PublicKey(Buffer.from(publicKey, 'hex'));
    return iotaPublicKey.toIotaAddress();
  }

  // ========================================
  // Recovery Validation Methods
  // ========================================

  getSafeNumber(defaultVal: number, errorMsg: string, inputVal?: number): number {
    if (inputVal === undefined) {
      return defaultVal;
    }
    let nonNegativeNum: number;
    try {
      nonNegativeNum = Number(inputVal);
    } catch (e) {
      throw new Error(errorMsg);
    }
    if (isNaN(nonNegativeNum.valueOf()) || nonNegativeNum < 0) {
      throw new Error(errorMsg);
    }
    return nonNegativeNum;
  }
}

/**
 * Singleton instance of the Utils class.
 * Use this for all IOTA utility operations throughout the SDK.
 *
 * @example
 * ```typescript
 * import utils from './utils';
 *
 * if (utils.isValidAddress(address)) {
 *   // Process valid address
 * }
 * ```
 */
const utils = new Utils();

export default utils;
