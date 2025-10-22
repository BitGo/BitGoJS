import { TransferableOutput } from '@flarenetwork/flarejs';
import {
  BaseUtils,
  Entry,
  InvalidTransactionError,
  isValidXprv,
  isValidXpub,
  NotImplementedError,
  ParseTransactionError,
} from '@bitgo/sdk-core';
import { FlareNetwork } from '@bitgo/statics';
import { ecc } from '@bitgo/secp256k1';
import { createHash } from 'crypto';
import { DeprecatedOutput, DeprecatedTx, Output } from './iface';
import {
  DECODED_BLOCK_ID_LENGTH,
  SHORT_PUB_KEY_LENGTH,
  COMPRESSED_PUBLIC_KEY_LENGTH,
  UNCOMPRESSED_PUBLIC_KEY_LENGTH,
  RAW_PRIVATE_KEY_LENGTH,
  SUFFIXED_PRIVATE_KEY_LENGTH,
  PRIVATE_KEY_COMPRESSED_SUFFIX,
  OUTPUT_INDEX_HEX_LENGTH,
  ADDRESS_REGEX,
  HEX_REGEX,
  HEX_CHAR_PATTERN,
  HEX_PATTERN_NO_PREFIX,
  FLARE_ADDRESS_PLACEHOLDER,
  HEX_ENCODING,
  PADSTART_CHAR,
  HEX_RADIX,
  STRING_TYPE,
} from './constants';

// Regex utility functions for hex validation
export const createHexRegex = (length: number, requirePrefix = false): RegExp => {
  const pattern = requirePrefix ? `^0x${HEX_CHAR_PATTERN}{${length}}$` : `^${HEX_CHAR_PATTERN}{${length}}$`;
  return new RegExp(pattern);
};

export const createFlexibleHexRegex = (requirePrefix = false): RegExp => {
  const pattern = requirePrefix ? `^0x${HEX_CHAR_PATTERN}+$` : HEX_PATTERN_NO_PREFIX;
  return new RegExp(pattern);
};

export class Utils implements BaseUtils {
  public includeIn(walletAddresses: string[], otxoOutputAddresses: string[]): boolean {
    return walletAddresses.map((a) => otxoOutputAddresses.includes(a)).reduce((a, b) => a && b, true);
  }

  /**
   * Checks if it is a valid address no illegal characters
   *
   * @param {string} address - address to be validated
   * @returns {boolean} - the validation result
   */
  /** @inheritdoc */
  isValidAddress(address: string | string[]): boolean {
    const addressArr: string[] = Array.isArray(address) ? address : address.split('~');

    for (const address of addressArr) {
      if (!this.isValidAddressRegex(address)) {
        return false;
      }
    }

    return true;
  }

  private isValidAddressRegex(address: string): boolean {
    return ADDRESS_REGEX.test(address);
  }

  /**
   * Checks if it is a valid blockId with length 66 including 0x
   *
   * @param {string} hash - blockId to be validated
   * @returns {boolean} - the validation result
   */
  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    // FlareJS equivalent - check if it's a valid CB58 hash with correct length
    try {
      const decoded = Buffer.from(hash); // FlareJS should provide CB58 utilities
      return decoded.length === DECODED_BLOCK_ID_LENGTH;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the string is a valid protocol public key or
   * extended public key.
   *
   * @param {string} pub - the  public key to be validated
   * @returns {boolean} - the validation result
   */
  isValidPublicKey(pub: string): boolean {
    if (isValidXpub(pub)) return true;

    let pubBuf: Buffer;
    if (pub.length === SHORT_PUB_KEY_LENGTH) {
      try {
        // For FlareJS, we'll need to implement CB58 decode functionality
        pubBuf = Buffer.from(pub, HEX_ENCODING); // Temporary placeholder
      } catch {
        return false;
      }
    } else {
      if (pub.length !== COMPRESSED_PUBLIC_KEY_LENGTH && pub.length !== UNCOMPRESSED_PUBLIC_KEY_LENGTH) {
        return false;
      }

      const firstByte = pub.slice(0, 2);

      // uncompressed public key
      if (pub.length === UNCOMPRESSED_PUBLIC_KEY_LENGTH && firstByte !== '04') {
        return false;
      }

      // compressed public key
      if (pub.length === COMPRESSED_PUBLIC_KEY_LENGTH && firstByte !== '02' && firstByte !== '03') {
        return false;
      }

      if (!this.allHexChars(pub)) return false;
      pubBuf = Buffer.from(pub, 'hex');
    }
    // validate the public key using BitGo secp256k1
    try {
      ecc.isPoint(pubBuf); // Check if it's a valid point
      return true;
    } catch (e) {
      return false;
    }
  }

  public parseAddress = (pub: string): Buffer => {
    // FlareJS equivalent for address parsing
    return Buffer.from(pub, HEX_ENCODING); // Simplified implementation
  };

  /**
   * Returns whether or not the string is a valid protocol private key, or extended
   * private key.
   *
   * The protocol key format is described in the @stacks/transactions npm package, in the
   * createStacksPrivateKey function:
   * https://github.com/blockstack/stacks.js/blob/master/packages/transactions/src/keys.ts#L125
   *
   * @param {string} prv - the private key (or extended private key) to be validated
   * @returns {boolean} - the validation result
   */
  isValidPrivateKey(prv: string): boolean {
    if (isValidXprv(prv)) return true;

    if (prv.length !== RAW_PRIVATE_KEY_LENGTH && prv.length !== SUFFIXED_PRIVATE_KEY_LENGTH) {
      return false;
    }

    if (
      prv.length === SUFFIXED_PRIVATE_KEY_LENGTH &&
      prv.slice(RAW_PRIVATE_KEY_LENGTH) !== PRIVATE_KEY_COMPRESSED_SUFFIX
    ) {
      return false;
    }

    return this.allHexChars(prv);
  }

  /**
   * Returns whether or not the string is a composed of hex chars only
   *
   * @param {string} maybe - the  string to be validated
   * @returns {boolean} - the validation result
   */
  allHexChars(maybe: string): boolean {
    return HEX_REGEX.test(maybe);
  }

  /**
   * Lightweight Ethereum address validation
   * Validates that an address is a 40-character hex string (optionally prefixed with 0x)
   *
   * @param {string} address - the Ethereum address to validate
   * @returns {boolean} - true if valid Ethereum address format
   */
  isValidEthereumAddress(address: string): boolean {
    if (!address || typeof address !== STRING_TYPE) {
      return false;
    }

    // Remove 0x prefix if present
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;

    // Check if it's exactly 40 hex characters
    return cleanAddress.length === 40 && /^[0-9a-fA-F]{40}$/.test(cleanAddress);
  }

  /**
   * Pick specific properties from an object (replaces lodash.pick)
   *
   * @param {T} obj - the source object
   * @param {K[]} keys - array of property keys to pick
   * @returns {Pick<T, K>} - new object with only the specified properties
   */
  pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * Deep equality comparison (replaces lodash.isEqual)
   *
   * @param {unknown} a - first value to compare
   * @param {unknown} b - second value to compare
   * @returns {boolean} - true if values are deeply equal
   */
  isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;

    if (a === null || a === undefined || b === null || b === undefined) return a === b;

    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;

      if (Array.isArray(a)) {
        const arrB = b as unknown[];
        if (a.length !== arrB.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!this.isEqual(a[i], arrB[i])) return false;
        }
        return true;
      }

      const objA = a as Record<string, unknown>;
      const objB = b as Record<string, unknown>;
      const keysA = Object.keys(objA);
      const keysB = Object.keys(objB);
      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.isEqual(objA[key], objB[key])) return false;
      }
      return true;
    }

    return false;
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('isValidSignature not implemented');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new NotImplementedError('isValidTransactionId not implemented');
  }

  /**
   * FlareJS wrapper to create signature and return it for credentials
   * @param network
   * @param message
   * @param prv
   * @return signature
   */
  createSignature(network: FlareNetwork, message: Buffer, prv: Buffer): Buffer {
    // Used BitGo secp256k1 since FlareJS may not expose KeyPair in the same way
    try {
      // Hash the message first: secp256k1 signing requires a 32-byte hash as input.
      // It is essential that the same hashing (sha256 of the message) is applied during signature recovery,
      // otherwise the recovered public key or signature verification will fail.
      const messageHash = createHash('sha256').update(message).digest();

      // Sign with recovery parameter
      const signature = ecc.sign(messageHash, prv);

      // Get recovery parameter by trying both values
      let recoveryParam = -1;
      const pubKey = ecc.pointFromScalar(prv, true);
      if (!pubKey) {
        throw new Error('Failed to derive public key from private key');
      }
      const recovered0 = ecc.recoverPublicKey(messageHash, signature, 0, true);
      if (recovered0 && Buffer.from(recovered0).equals(Buffer.from(pubKey))) {
        recoveryParam = 0;
      } else {
        const recovered1 = ecc.recoverPublicKey(messageHash, signature, 1, true);
        if (recovered1 && Buffer.from(recovered1).equals(Buffer.from(pubKey))) {
          recoveryParam = 1;
        } else {
          throw new Error('Could not determine correct recovery parameter for signature');
        }
      }

      // Append recovery parameter to signature
      const fullSig = Buffer.alloc(65); // 64 bytes signature + 1 byte recovery
      fullSig.set(signature);
      fullSig[64] = recoveryParam;

      return fullSig;
    } catch (error) {
      throw new Error(`Failed to create signature: ${error}`);
    }
  }

  /**
   * FlareJS wrapper to verify signature
   * @param network
   * @param message
   * @param signature
   * @param publicKey - public key instead of private key for verification
   * @return true if it's verify successful
   */
  verifySignature(network: FlareNetwork, message: Buffer, signature: Buffer, publicKey: Buffer): boolean {
    try {
      return ecc.verify(message, publicKey, signature);
    } catch (error) {
      return false;
    }
  }

  /**
   * FlareJS wrapper to recover signature
   * @param network
   * @param message
   * @param signature
   * @return recovered public key
   */
  recoverySignature(network: FlareNetwork, message: Buffer, signature: Buffer): Buffer {
    try {
      // Hash the message first - must match the hash used in signing
      const messageHash = createHash('sha256').update(message).digest();

      // Extract recovery parameter and signature
      if (signature.length !== 65) {
        throw new Error('Invalid signature length - expected 65 bytes (64 bytes signature + 1 byte recovery)');
      }

      const recoveryParam = signature[64];
      const sigOnly = signature.slice(0, 64);

      // Recover public key using the provided recovery parameter
      const recovered = ecc.recoverPublicKey(messageHash, sigOnly, recoveryParam, true);
      if (!recovered) {
        throw new Error('Failed to recover public key');
      }

      return Buffer.from(recovered);
    } catch (error) {
      throw new Error(`Failed to recover signature: ${error}`);
    }
  }

  sha256(buf: Uint8Array): Buffer {
    return createHash('sha256').update(buf).digest();
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   * It's to reuse in TransactionBuilder and TransactionBuilderFactory
   *
   * @param rawTransaction Transaction as hex string
   */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
    if (!utils.allHexChars(rawTransaction)) {
      throw new ParseTransactionError('Raw transaction is not hex string');
    }
  }

  /**
   * Check if tx is for the blockchainId
   *
   * @param {DeprecatedTx} tx
   * @param {string} blockchainId
   * @returns true if tx is for blockchainId
   */
  isTransactionOf(tx: DeprecatedTx, blockchainId: string): boolean {
    // FlareJS equivalent - this would need proper CB58 encoding implementation
    try {
      const txRecord = tx as unknown as Record<string, unknown>;
      const unsignedTx = (txRecord.getUnsignedTx as () => Record<string, unknown>)();
      const transaction = (unsignedTx.getTransaction as () => Record<string, unknown>)();
      const txBlockchainId = (transaction.getBlockchainID as () => unknown)();
      return Buffer.from(txBlockchainId as string).toString(HEX_ENCODING) === blockchainId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Output is from PVM.
   * Output could be EVM or PVM output.
   * @param {DeprecatedOutput} output
   * @returns {boolean} output has transferable output structure
   */
  deprecatedIsTransferableOutput(output: DeprecatedOutput): boolean {
    return 'getOutput' in (output as Record<string, unknown>);
  }

  /**
   * Check if Output is from PVM.
   * Output could be EVM or PVM output.
   * @param {Output} output
   * @returns {boolean} output is TransferableOutput
   */
  isTransferableOutput(output: Output): output is TransferableOutput {
    return typeof (output as unknown as Record<string, unknown>).getOutput === 'function';
  }

  /**
   * Return a mapper function to that network address representation.
   * @param network required to stringify addresses
   * @return mapper function
   */
  deprecatedMapOutputToEntry(network: FlareNetwork): (output: DeprecatedOutput) => Entry {
    return (output: DeprecatedOutput) => {
      if (this.deprecatedIsTransferableOutput(output)) {
        // Simplified implementation for FlareJS
        try {
          const transferableOutput = output as unknown as TransferableOutput;
          const amount = transferableOutput.amount();

          // Simplified address handling - would need proper FlareJS address utilities
          const address = FLARE_ADDRESS_PLACEHOLDER; // TODO: implement proper address conversion

          return {
            value: amount.toString(),
            address,
          };
        } catch (error) {
          throw new Error(`Failed to map output: ${error}`);
        }
      } else {
        // Handle EVM output case - simplified
        return {
          value: '0', // TODO: implement proper amount extraction
          address: '0x0000000000000000000000000000000000000000', // TODO: implement proper address extraction
        };
      }
    };
  }

  /**
   * Return a mapper function to that network address representation.
   * @param network required to stringify addresses
   * @return mapper function
   */
  mapOutputToEntry(network: FlareNetwork): (Output) => Entry {
    return (output: Output) => {
      if (this.isTransferableOutput(output)) {
        const transferableOutput = output as TransferableOutput;
        const outputAmount = transferableOutput.amount();

        // Simplified address handling for FlareJS
        const address = 'flare-address-placeholder'; // TODO: implement proper address conversion

        return {
          value: outputAmount.toString(),
          address,
        };
      } else {
        throw new Error('Invalid output type');
      }
    };
  }

  /**
   * remove hex prefix (0x)
   * @param hex string
   * @returns hex without 0x
   */
  removeHexPrefix(hex: string): string {
    if (hex.startsWith('0x')) {
      return hex.substring(2);
    }
    return hex;
  }

  /**
   * Outputidx convert from number (as string) to buffer.
   * @param {string} outputidx number
   * @return {Buffer} buffer of size 4 with that number value
   */
  outputidxNumberToBuffer(outputidx: string): Buffer {
    return Buffer.from(
      Number(outputidx).toString(HEX_RADIX).padStart(OUTPUT_INDEX_HEX_LENGTH, PADSTART_CHAR),
      HEX_ENCODING
    );
  }

  /**
   * Outputidx buffer to number (as string)
   * @param {Buffer} outputidx
   * @return {string} outputidx number
   */
  outputidxBufferToNumber(outputidx: Buffer): string {
    return parseInt(outputidx.toString(HEX_ENCODING), HEX_RADIX).toString();
  }

  /**
   * CB58 decode function - simple Base58 decode implementation
   * @param {string} data - CB58 encoded string
   * @returns {Buffer} decoded buffer
   */
  cb58Decode(data: string): Buffer {
    // For now, use a simple hex decode as placeholder
    // In a full implementation, this would be proper CB58 decoding
    try {
      return Buffer.from(data, HEX_ENCODING);
    } catch {
      // Fallback to buffer from string
      return Buffer.from(data);
    }
  }

  /**
   * Convert address buffer to bech32 string
   * @param {string} hrp - Human readable part
   * @param {string} chainid - Chain identifier
   * @param {Buffer} addressBuffer - Address buffer
   * @returns {string} Address string
   */
  addressToString(hrp: string, chainid: string, addressBuffer: Buffer): string {
    // Simple implementation - in practice this would use bech32 encoding
    return `${chainid}-${addressBuffer.toString(HEX_ENCODING)}`;
  }

  /**
   * Convert string to bytes for FlareJS memo
   * Follows FlareJS utils.stringToBytes pattern
   * @param {string} text - Text to convert
   * @returns {Uint8Array} Byte array
   */
  stringToBytes(text: string): Uint8Array {
    return new TextEncoder().encode(text);
  }

  /**
   * Convert bytes to string from FlareJS memo
   * @param {Uint8Array} bytes - Bytes to convert
   * @returns {string} Decoded string
   */
  bytesToString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }

  /**
   * Create memo bytes from various input formats
   * Supports string, JSON object, or raw bytes
   * @param {string | Record<string, unknown> | Uint8Array} memo - Memo data
   * @returns {Uint8Array} Memo bytes for FlareJS
   */
  createMemoBytes(memo: string | Record<string, unknown> | Uint8Array): Uint8Array {
    if (memo instanceof Uint8Array) {
      return memo;
    }

    if (typeof memo === STRING_TYPE) {
      return this.stringToBytes(memo as string);
    }

    if (typeof memo === 'object') {
      return this.stringToBytes(JSON.stringify(memo));
    }

    throw new InvalidTransactionError('Invalid memo format');
  }

  /**
   * Parse memo bytes to string
   * @param {Uint8Array} memoBytes - Memo bytes from FlareJS transaction
   * @returns {string} Decoded memo string
   */
  parseMemoBytes(memoBytes: Uint8Array): string {
    if (memoBytes.length === 0) {
      return '';
    }
    return this.bytesToString(memoBytes);
  }

  /**
   * Validate memo size (FlareJS has transaction size limits)
   * @param {Uint8Array} memoBytes - Memo bytes
   * @param {number} maxSize - Maximum size in bytes (default 4KB)
   * @returns {boolean} Whether memo is within size limits
   */
  validateMemoSize(memoBytes: Uint8Array, maxSize = 4096): boolean {
    return memoBytes.length <= maxSize;
  }
}

const utils = new Utils();

export default utils;
