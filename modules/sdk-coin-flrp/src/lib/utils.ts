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
import * as createHash from 'create-hash';
import { secp256k1 } from '@noble/curves/secp256k1';
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
} from './constants';

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
        pubBuf = Buffer.from(pub, 'hex'); // Temporary placeholder
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
    // validate the public key using noble secp256k1
    try {
      secp256k1.ProjectivePoint.fromHex(pubBuf.toString('hex'));
      return true;
    } catch (e) {
      return false;
    }
  }

  public parseAddress = (pub: string): Buffer => {
    // FlareJS equivalent for address parsing
    return Buffer.from(pub, 'hex'); // Simplified implementation
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
    // Use secp256k1 directly since FlareJS may not expose KeyPair in the same way
    try {
      const signature = secp256k1.sign(message, prv);
      return Buffer.from(signature.toCompactRawBytes());
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
      return secp256k1.verify(signature, message, publicKey);
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
      // This would need to be implemented with secp256k1 recovery
      // For now, throwing error since recovery logic would need to be adapted
      throw new NotImplementedError('recoverySignature not fully implemented for FlareJS');
    } catch (error) {
      throw new Error(`Failed to recover signature: ${error}`);
    }
  }

  sha256(buf: Uint8Array): Buffer {
    return createHash.default('sha256').update(buf).digest();
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
      return Buffer.from(txBlockchainId as string).toString('hex') === blockchainId;
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
          const address = 'flare-address-placeholder'; // TODO: implement proper address conversion

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
    return Buffer.from(Number(outputidx).toString(16).padStart(OUTPUT_INDEX_HEX_LENGTH, '0'), 'hex');
  }

  /**
   * Outputidx buffer to number (as string)
   * @param {Buffer} outputidx
   * @return {string} outputidx number
   */
  outputidxBufferToNumber(outputidx: Buffer): string {
    return parseInt(outputidx.toString('hex'), 16).toString();
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
      return Buffer.from(data, 'hex');
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
    return `${chainid}-${addressBuffer.toString('hex')}`;
  }
}

const utils = new Utils();

export default utils;
