import { Signature, TransferableOutput, TransferOutput, TypeSymbols, Id } from '@flarenetwork/flarejs';
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
import { Buffer } from 'buffer';
import { createHash } from 'crypto';
import { ecc } from '@bitgo/secp256k1';
import { ADDRESS_SEPARATOR, Output, DeprecatedTx } from './iface';
import bs58 from 'bs58';
import { bech32 } from 'bech32';

export class Utils implements BaseUtils {
  /**
   * Check if addresses in wallet match UTXO output addresses
   */
  public includeIn(walletAddresses: string[], otxoOutputAddresses: string[]): boolean {
    return walletAddresses.map((a) => otxoOutputAddresses.includes(a)).reduce((a, b) => a && b, true);
  }

  /**
   * Validates a Flare address or array of addresses
   * @param {string | string[]} address - address(es) to validate
   * @returns {boolean} - validation result
   */
  isValidAddress(address: string | string[]): boolean {
    const addressArr: string[] = Array.isArray(address) ? address : address.split('~');

    for (const address of addressArr) {
      if (!this.isValidAddressRegex(address)) {
        return false;
      }
    }

    return true;
  }

  // Regex patterns
  // export const ADDRESS_REGEX = /^(^P||NodeID)-[a-zA-Z0-9]+$/;
  // export const HEX_REGEX = /^(0x){0,1}([0-9a-f])+$/i;

  private isValidAddressRegex(address: string): boolean {
    return /^(^P||NodeID)-[a-zA-Z0-9]+$/.test(address);
  }

  /**
   * Validates a block ID
   * @param {string} hash - block ID to validate
   * @returns {boolean} - validation result
   */
  isValidBlockId(hash: string): boolean {
    try {
      const decoded = Buffer.from(hash, 'hex');
      return decoded.length === 32;
    } catch {
      return false;
    }
  }

  /**
   * Validates a public key
   * @param {string} pub - public key to validate
   * @returns {boolean} - validation result
   */
  isValidPublicKey(pub: string): boolean {
    if (isValidXpub(pub)) return true;

    let pubBuf: Buffer;
    if (pub.length === 50) {
      try {
        pubBuf = Buffer.from(pub, 'hex');
      } catch {
        return false;
      }
    } else {
      if (pub.length !== 66 && pub.length !== 130) return false;

      const firstByte = pub.slice(0, 2);
      if (pub.length === 130 && firstByte !== '04') return false;
      if (pub.length === 66 && firstByte !== '02' && firstByte !== '03') return false;
      if (!this.allHexChars(pub)) return false;

      pubBuf = Buffer.from(pub, 'hex');
    }

    try {
      ecc.isPoint(pubBuf);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Validates a private key
   * @param {string} prv - private key to validate
   * @returns {boolean} - validation result
   */
  isValidPrivateKey(prv: string): boolean {
    if (isValidXprv(prv)) return true;
    if (prv.length !== 64 && prv.length !== 66) return false;
    if (prv.length === 66 && prv.slice(64) !== '01') return false;
    return this.allHexChars(prv);
  }

  /**
   * Checks if a string contains only hex characters
   */
  allHexChars(str: string): boolean {
    return /^(0x){0,1}([0-9a-f])+$/i.test(str);
  }

  /**
   * Creates a signature using the Flare network parameters
   * Returns a 65-byte signature (64 bytes signature + 1 byte recovery parameter)
   */
  createSignature(network: FlareNetwork, message: Buffer, prv: Buffer): Buffer {
    const messageHash = this.sha256(message);
    const signature = ecc.sign(messageHash, prv);

    // Get the public key from the private key for recovery parameter determination
    const publicKey = ecc.pointFromScalar(prv, true);
    if (!publicKey) {
      throw new Error('Failed to derive public key from private key');
    }

    // Try recovery with param 0 and 1 to find the correct one
    let recoveryParam = 0;
    for (let i = 0; i <= 1; i++) {
      const recovered = ecc.recoverPublicKey(messageHash, signature, i, true);
      if (recovered && Buffer.from(recovered).equals(Buffer.from(publicKey))) {
        recoveryParam = i;
        break;
      }
    }

    // Append recovery parameter to create 65-byte signature
    const sigWithRecovery = Buffer.alloc(65);
    Buffer.from(signature).copy(sigWithRecovery, 0);
    sigWithRecovery[64] = recoveryParam;

    return sigWithRecovery;
  }

  /**
   * Verifies a signature
   */
  verifySignature(network: FlareNetwork, message: Buffer, signature: Buffer, publicKey: Buffer): boolean {
    try {
      const messageHash = this.sha256(message);
      return ecc.verify(signature, messageHash, publicKey);
    } catch (e) {
      return false;
    }
  }

  /**
   * Creates a new signature object
   */
  createNewSig(sigHex: string): Signature {
    const buffer = Buffer.from(sigHex.padStart(130, '0'), 'hex');
    return new Signature(buffer);
  }

  /**
   * Computes SHA256 hash
   */
  sha256(buf: Uint8Array): Buffer {
    return createHash('sha256').update(buf).digest();
  }

  /**
   * Validates raw transaction format
   */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
    if (!this.allHexChars(rawTransaction)) {
      throw new ParseTransactionError('Raw transaction is not hex string');
    }
  }

  /**
   * Checks if output is TransferableOutput type
   */
  isTransferableOutput(output: Output): output is TransferableOutput {
    return output?._type === TypeSymbols.TransferableOutput;
  }

  /**
   * Maps outputs to entry format
   */
  mapOutputToEntry(network: FlareNetwork): (Output) => Entry {
    return (output: Output) => {
      if (this.isTransferableOutput(output)) {
        const outputAmount = output.amount();
        const address = (output.output as TransferOutput)
          .getOwners()
          .map((a) => this.addressToString(network.hrp, network.alias, Buffer.from(a)))
          .sort()
          .join(ADDRESS_SEPARATOR);
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
   * Removes 0x prefix from hex string
   */
  removeHexPrefix(hex: string): string {
    return hex.startsWith('0x') ? hex.substring(2) : hex;
  }

  /**
   * Converts output index to buffer
   */
  outputidxNumberToBuffer(outputidx: string): Buffer {
    return Buffer.from(Number(outputidx).toString(16).padStart(8, '0'), 'hex');
  }

  /**
   * Converts output index buffer to number string
   */
  outputidxBufferToNumber(outputidx: Buffer): string {
    return parseInt(outputidx.toString('hex'), 16).toString();
  }

  // Required by BaseUtils interface but not implemented
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('isValidSignature not implemented');
  }

  isValidTransactionId(txId: string): boolean {
    throw new NotImplementedError('isValidTransactionId not implemented');
  }

  /**
   * Helper method to convert address components to string
   */
  public addressToString = (hrp: string, prefix: string, address: Buffer): string => {
    // Convert the address bytes to 5-bit words for bech32 encoding
    const words = bech32.toWords(address);
    // Create the full bech32 address with format: P-{hrp}1{bech32_encoded_address}
    return `${prefix}-${bech32.encode(hrp, words)}`;
  };

  /**
   * Decodes a base58 string with checksum to a Buffer
   */
  public cb58Decode(str: string): Buffer {
    const decoded = bs58.decode(str);
    if (!this.validateChecksum(Buffer.from(decoded))) {
      throw new Error('Invalid checksum');
    }
    return Buffer.from(decoded.slice(0, decoded.length - 4));
  }

  /**
   * Validates a checksum on a Buffer and returns true if valid, false if not
   */
  private validateChecksum(buff: Buffer): boolean {
    const hashSlice = buff.slice(buff.length - 4);
    const calculatedHashSlice = createHash('sha256')
      .update(buff.slice(0, buff.length - 4))
      .digest()
      .slice(28);
    return hashSlice.toString('hex') === calculatedHashSlice.toString('hex');
  }

  /**
   * Encodes a Buffer as a base58 string with checksum
   */
  public cb58Encode(bytes: Buffer): string {
    const withChecksum = this.addChecksum(bytes);
    return bs58.encode(withChecksum);
  }

  /**
   * Adds a checksum to a Buffer and returns the concatenated result
   */
  private addChecksum(buff: Buffer): Buffer {
    const hashSlice = createHash('sha256').update(buff).digest().slice(28);
    return Buffer.concat([buff, hashSlice]);
  }

  // In utils.ts, add this method to the Utils class:

  /**
   * Parse an address string into a Buffer
   * @param address - The address to parse
   * @returns Buffer containing the parsed address
   */
  //TODO: need check and validate this method
  public parseAddress = (address: string): Buffer => {
    return this.stringToAddress(address);
  };

  public stringToAddress = (address: string, hrp?: string): Buffer => {
    // Handle hex addresses
    if (address.startsWith('0x')) {
      return Buffer.from(address.slice(2), 'hex');
    }

    // Handle raw hex without 0x prefix
    if (/^[0-9a-fA-F]{40}$/.test(address)) {
      return Buffer.from(address, 'hex');
    }

    // Handle Bech32 addresses
    const parts = address.trim().split('-');
    if (parts.length < 2) {
      throw new Error('Error - Valid address should include -');
    }

    const split = parts[1].lastIndexOf('1');
    if (split < 0) {
      throw new Error('Error - Valid bech32 address must include separator (1)');
    }

    const humanReadablePart = parts[1].slice(0, split);
    if (humanReadablePart !== 'flare' && humanReadablePart !== 'costwo') {
      throw new Error('Error - Invalid HRP');
    }

    return Buffer.from(bech32.fromWords(bech32.decode(parts[1]).words));
  };

  /**
   * Check if tx is for the blockchainId
   *
   * @param {DeprecatedTx} tx
   * @param {string} blockchainId
   * @returns true if tx is for blockchainId
   */
  // TODO: remove DeprecatedTx usage
  isTransactionOf(tx: DeprecatedTx, blockchainId: string): boolean {
    // FlareJS equivalent - this would need proper CB58 encoding implementation
    try {
      const txRecord = tx as unknown as Record<string, unknown>;
      const unsignedTx = (txRecord.getUnsignedTx as () => Record<string, unknown>)();
      const transaction = (unsignedTx.getTransaction as () => Record<string, unknown>)();
      const txBlockchainId = (transaction.getBlockchainID as () => unknown)();
      return Buffer.from(txBlockchainId as string).toString('hex') === blockchainId;
    } catch (error) {
      return false;
    }
  }

  flareIdString(value: string): Id {
    return new Id(Buffer.from(value, 'hex'));
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
}

const utils = new Utils();
export default utils;
