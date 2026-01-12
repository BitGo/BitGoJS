import {
  Signature,
  TransferableOutput,
  TransferOutput,
  TypeSymbols,
  Id,
  Utxo,
  BigIntPr,
  OutputOwners,
  avaxSerial,
} from '@flarenetwork/flarejs';
import {
  BaseUtils,
  Entry,
  InvalidTransactionError,
  isValidXprv,
  isValidXpub,
  ParseTransactionError,
} from '@bitgo/sdk-core';
import { FlareNetwork } from '@bitgo/statics';
import { Buffer } from 'buffer';
import { createHash } from 'crypto';
import { ecc } from '@bitgo/secp256k1';
import { ADDRESS_SEPARATOR, DecodedUtxoObj, Output, SECP256K1_Transfer_Output, Tx } from './iface';
import bs58 from 'bs58';
import { bech32 } from 'bech32';

export class Utils implements BaseUtils {
  isValidTransactionId(txId: string): boolean {
    throw new Error('Method not implemented.');
  }
  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented.');
  }
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
   * @param messageHash - The SHA256 hash of the message (e.g., signablePayload)
   * @param signature - The 64-byte signature (without recovery parameter)
   * @param publicKey - The public key to verify against
   * @returns true if signature is valid
   */
  verifySignature(messageHash: Buffer, signature: Buffer, publicKey: Buffer): boolean {
    try {
      return ecc.verify(messageHash, publicKey, signature);
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
   * Creates an empty signature with embedded address for signature slot identification.
   * The address is embedded at position 90 (after the first 45 zero bytes).
   * This allows the signing logic to determine which slot belongs to which address.
   * @param addressHex The 20-byte address in hex format (40 chars, without 0x prefix)
   */
  createEmptySigWithAddress(addressHex: string): Signature {
    // First 45 bytes (90 hex chars) are zeros, followed by 20-byte address (40 hex chars)
    const cleanAddr = this.removeHexPrefix(addressHex).toLowerCase();
    const sigHex = '0'.repeat(90) + cleanAddr.padStart(40, '0');
    const buffer = Buffer.from(sigHex, 'hex');
    return new Signature(buffer);
  }

  /**
   * Extracts the embedded address from an empty signature.
   * Returns the address hex string (40 chars) or empty string if not found.
   */
  getAddressFromEmptySig(sig: string): string {
    const cleanSig = this.removeHexPrefix(sig);
    if (cleanSig.length >= 130) {
      // Address is at position 90-130 (last 40 hex chars = 20 bytes)
      return cleanSig.substring(90, 130).toLowerCase();
    }
    return '';
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
   * Uses last 4 bytes of SHA256 hash as checksum (matching avaxp behavior)
   */
  public addChecksum(buff: Buffer | Uint8Array): Uint8Array {
    const buffer = Buffer.from(buff);
    const hashSlice = createHash('sha256').update(buffer).digest().slice(28);
    return new Uint8Array(Buffer.concat([buffer, hashSlice]));
  }

  // In utils.ts, add this method to the Utils class:

  /**
   * Parse an address string into a Buffer
   * @param address - The address to parse
   * @returns Buffer containing the parsed address
   */
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

  flareIdString(value: string): Id {
    return new Id(Buffer.from(value, 'hex'));
  }

  /**
   * Recover public key from signature
   * @param messageHash - The SHA256 hash of the message (e.g., signablePayload)
   * @param signature - 65-byte signature (64 bytes signature + 1 byte recovery parameter)
   * @return recovered public key
   */
  recoverySignature(messageHash: Buffer, signature: Buffer): Buffer {
    try {
      // Extract recovery parameter and signature
      if (signature.length !== 65) {
        throw new Error('Invalid signature length - expected 65 bytes (64 bytes signature + 1 byte recovery)');
      }

      const recoveryParam = signature[64];
      const sigOnly = signature.slice(0, 64);

      // Recover public key using the provided recovery parameter
      // messageHash should already be the SHA256 hash (signablePayload)
      const recovered = ecc.recoverPublicKey(messageHash, sigOnly, recoveryParam, true);
      if (!recovered) {
        throw new Error('Failed to recover public key');
      }

      return Buffer.from(recovered);
    } catch (error) {
      throw new Error(`Failed to recover signature: ${error.message}`);
    }
  }

  /**
   * Check if tx is for the blockchainId
   *
   * @param {Tx} tx
   * @param {string} blockchainId - blockchain ID in hex format
   * @returns true if tx is for blockchainId
   */
  isTransactionOf(tx: Tx, blockchainId: string): boolean {
    // Note: getBlockchainId() and BlockchainId.value() return CB58-encoded strings,
    // but we need hex format, so we use toBytes() and convert to hex
    const extractBlockchainId = (txObj: any): string | null => {
      if (typeof txObj.getTx === 'function') {
        const innerTx = txObj.getTx();
        if (innerTx.baseTx?.BlockchainId?.toBytes) {
          return Buffer.from(innerTx.baseTx.BlockchainId.toBytes()).toString('hex');
        }
        if (innerTx.blockchainId?.toBytes) {
          return Buffer.from(innerTx.blockchainId.toBytes()).toString('hex');
        }
      }

      if (txObj.tx?.baseTx?.BlockchainId?.toBytes) {
        return Buffer.from(txObj.tx.baseTx.BlockchainId.toBytes()).toString('hex');
      }

      if (txObj.baseTx?.BlockchainId?.toBytes) {
        return Buffer.from(txObj.baseTx.BlockchainId.toBytes()).toString('hex');
      }
      if (txObj.blockchainId?.toBytes) {
        return Buffer.from(txObj.blockchainId.toBytes()).toString('hex');
      }

      return null;
    };

    const txBlockchainId = extractBlockchainId(tx);
    return txBlockchainId === blockchainId;
  }

  /**
   * Convert FlareJS native Utxo to DecodedUtxoObj for internal use
   * @param utxo - FlareJS Utxo object
   * @param network - Flare network configuration
   * @returns DecodedUtxoObj compatible with existing methods
   */
  public utxoToDecoded(utxo: Utxo, network: FlareNetwork): DecodedUtxoObj {
    const outputOwners = utxo.getOutputOwners();
    const output = utxo.output as TransferOutput;

    // Get amount from output
    const amount = output.amount().toString();

    // Get txid from utxoId (cb58 encoded)
    const txid = this.cb58Encode(Buffer.from(utxo.utxoId.txID.toBytes()));

    // Get output index
    const outputidx = utxo.utxoId.outputIdx.value().toString();

    // Get threshold
    const threshold = outputOwners.threshold.value();

    // Get locktime
    const locktime = outputOwners.locktime.value().toString();

    // Get addresses as bech32 strings
    const addresses = outputOwners.addrs.map((addr) =>
      this.addressToString(network.hrp, network.alias, Buffer.from(addr.toBytes()))
    );

    return {
      outputID: SECP256K1_Transfer_Output,
      locktime,
      amount,
      txid,
      outputidx,
      threshold,
      addresses,
    };
  }

  /**
   * Convert array of FlareJS Utxos to DecodedUtxoObj array
   * @param utxos - Array of FlareJS Utxo objects
   * @param network - Flare network configuration
   * @returns Array of DecodedUtxoObj
   */
  public utxosToDecoded(utxos: Utxo[], network: FlareNetwork): DecodedUtxoObj[] {
    return utxos.map((utxo) => this.utxoToDecoded(utxo, network));
  }

  /**
   * Convert DecodedUtxoObj to native FlareJS Utxo object
   * This is the reverse of utxoToDecoded
   * @param decoded - DecodedUtxoObj to convert
   * @param assetId - Asset ID as cb58 encoded string
   * @returns Native FlareJS Utxo object
   */
  public decodedToUtxo(decoded: DecodedUtxoObj, assetId: string): Utxo {
    // Create UTXOID from txid and output index
    const utxoId = avaxSerial.UTXOID.fromNative(decoded.txid, parseInt(decoded.outputidx, 10));

    // Parse addresses from bech32 strings to byte buffers
    const addressBytes = decoded.addresses.map((addr) => this.parseAddress(addr));

    // Create OutputOwners with locktime, threshold, and addresses
    const locktime = decoded.locktime ? BigInt(decoded.locktime) : BigInt(0);
    const outputOwners = OutputOwners.fromNative(addressBytes, locktime, decoded.threshold);

    // Create TransferOutput with amount and owners
    const amount = BigInt(decoded.amount);
    const transferOutput = new TransferOutput(new BigIntPr(amount), outputOwners);

    // Create and return the Utxo
    return new Utxo(utxoId, Id.fromString(assetId), transferOutput);
  }

  /**
   * Convert array of DecodedUtxoObj to native FlareJS Utxo objects
   * @param decodedUtxos - Array of DecodedUtxoObj
   * @param assetId - Asset ID as cb58 encoded string
   * @returns Array of native FlareJS Utxo objects
   */
  public decodedToUtxos(decodedUtxos: DecodedUtxoObj[], assetId: string): Utxo[] {
    return decodedUtxos.map((decoded) => this.decodedToUtxo(decoded, assetId));
  }
}

const utils = new Utils();
export default utils;
