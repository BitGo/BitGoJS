import { BaseUtils, isValidEd25519PublicKey } from '@bitgo/sdk-core';
import crypto from 'crypto';
import { CryptoKeyFormat, SigningAlgorithmSpec, SigningKeySpec } from './constant';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

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
    return isValidEd25519PublicKey(key);
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
   * Converts a base64-encoded Ed25519 public key string into a structured signing public key object.
   * @param {String} publicKey The base64-encoded Ed25519 public key
   * @returns {Object} The structured signing key object formatted for use with cryptographic operations
   * @private
   */
  private signingPublicKeyFromEd25519(publicKey: string): {
    format: number;
    publicKey: Buffer;
    scheme: number;
    keySpec: number;
    usage: [];
  } {
    return {
      format: CryptoKeyFormat.RAW,
      publicKey: Buffer.from(publicKey, 'base64'),
      scheme: SigningAlgorithmSpec.ED25519,
      keySpec: SigningKeySpec.EC_CURVE25519,
      usage: [],
    };
  }

  /**
   * Creates a buffer with a 4-byte big-endian integer prefix followed by the provided byte buffer
   * @param {Number} value The integer to prefix, written as 4 bytes in big-endian order
   * @param {Buffer} bytes The buffer to append after the integer prefix
   * @returns {Buffer} The resulting buffer with the prefixed integer
   * @private
   */
  private prefixedInt(value: number, bytes: Buffer): Buffer {
    const buffer = Buffer.alloc(4 + bytes.length);
    buffer.writeUInt32BE(value, 0);
    Buffer.from(bytes).copy(buffer, 4);
    return buffer;
  }

  /**
   * Computes an SHA-256 Canton-style hash by prefixing the input with a purpose identifier,
   * then hashing the resulting buffer and prepending a multi-prefix
   *
   * @param {Number} purpose A numeric identifier to prefix the hash input with
   * @param {Buffer} bytes The buffer to be hashed
   * @returns {String} A hexadecimal string representation of the resulting hash with multi-prefix
   * @private
   */
  private computeSha256CantonHash(purpose: number, bytes: Buffer): string {
    const hashInput = this.prefixedInt(purpose, bytes);
    const hash = crypto.createHash('sha256').update(hashInput).digest();
    const multiprefix = Buffer.from([0x12, 0x20]);
    return Buffer.concat([multiprefix, hash]).toString('hex');
  }

  /**
   * Method to create fingerprint (part of the canton partyId) from public key
   * @param {String} publicKey the public key
   * @returns {String}
   */
  getAddressFromPublicKey(publicKey: string): string {
    const key = this.signingPublicKeyFromEd25519(publicKey);
    const hashPurpose = 12;
    return this.computeSha256CantonHash(hashPurpose, key.publicKey);
  }
}

const utils = new Utils();

export default utils;
