import { secp256k1 } from '@noble/curves/secp256k1';
import elliptic from 'elliptic';
import { BaseUtils, KeyPair, ParseTransactionError } from '@bitgo/sdk-core';
import { Principal as DfinityPrincipal } from '@dfinity/principal';
import * as agent from '@dfinity/agent';
import crypto from 'crypto';
import crc32 from 'crc-32';
import { HttpCanisterUpdate, IcpTransactionData, RequestType } from './iface';
import { KeyPair as IcpKeyPair } from './keyPair';
import { decode, encode } from 'cbor-x';
import js_sha256 from 'js-sha256';
const { ec: EC } = elliptic;

const Secp256k1Curve = new elliptic.ec('secp256k1');

export class Utils implements BaseUtils {
  isValidTransactionId(txId: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidBlockId(hash: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Retrieves the type of the transaction.
   *
   * @returns {string} The string 'TRANSACTION' indicating the type of the transaction.
   */
  getTransactionType(): string {
    return 'TRANSACTION';
  }

  /**
   * Retrieves the type of fee.
   *
   * @returns {string} The string 'FEE' representing the fee type.
   */
  getFeeType(): string {
    return 'FEE';
  }

  /**
   * Retrieves the network identifier as a string.
   *
   * @returns {string} The network identifier.
   */
  getNetwork(): string {
    return '00000000000000020101';
  }

  /**
   * Returns the type of elliptic curve used.
   *
   * @returns {string} The curve type, which is 'secp256k1'.
   */
  getCurveType(): string {
    return 'secp256k1';
  }

  /**
   * Retrieves the type of signature used.
   *
   * @returns {string} The signature type, which is 'ecdsa'.
   */
  getSignatureType(): string {
    return 'ecdsa';
  }

  /**
   * Checks if the provided address is a valid hexadecimal string.
   *
   * @param {string} address - The address to validate.
   * @returns {boolean} - Returns `true` if the address is a valid 64-character hexadecimal string, otherwise `false`.
   */
  isValidAddress(address: string): boolean {
    return typeof address === 'string' && /^[0-9a-fA-F]{64}$/.test(address);
  }

  /**
   * Checks if the provided hex string is a valid public key.
   *
   * A valid public key can be either compressed or uncompressed:
   * - Compressed public keys are 33 bytes long and start with either 0x02 or 0x03.
   * - Uncompressed public keys are 65 bytes long and start with 0x04.
   *
   * @param {string} hexStr - The hex string representation of the public key to validate.
   * @returns {boolean} - Returns `true` if the hex string is a valid public key, otherwise `false`.
   */
  isValidPublicKey(hexStr: string): boolean {
    if (!this.isValidHex(hexStr) || !this.isValidLength(hexStr)) {
      return false;
    }

    const pubKeyBytes = this.hexToBytes(hexStr);
    const firstByte = pubKeyBytes[0];
    const validCompressed = pubKeyBytes.length === 33 && (firstByte === 2 || firstByte === 3);
    const validUncompressed = pubKeyBytes.length === 65 && firstByte === 4;

    return validCompressed || validUncompressed;
  }

  /**
   * Encodes a value into CBOR format and returns it as a hex string.
   *
   * @param {any} value - The value to encode.
   * @returns {string} - The CBOR encoded value as a hex string.
   */
  cborEncode(value: any): string {
    const cborData = encode(value);
    return Buffer.from(cborData).toString('hex');
  }

  /**
   * Checks if the length of the given hexadecimal string is valid.
   * A valid length is either 66 characters (33 bytes) or 130 characters (65 bytes).
   *
   * @param {string} hexStr - The hexadecimal string to check.
   * @returns {boolean} - Returns `true` if the length is valid, otherwise `false`.
   */
  isValidLength(hexStr: string): boolean {
    return hexStr.length / 2 === 33 || hexStr.length / 2 === 65;
  }

  /**
   * Checks if the provided string is a valid hexadecimal string.
   *
   * A valid hexadecimal string consists of pairs of hexadecimal digits (0-9, a-f, A-F).
   *
   * @param hexStr - The string to be validated as a hexadecimal string.
   * @returns True if the string is a valid hexadecimal string, false otherwise.
   */
  isValidHex(hexStr: string): boolean {
    return /^([0-9a-fA-F]{2})+$/.test(hexStr);
  }

  /**
   * Converts a hexadecimal string to a Uint8Array.
   *
   * @param {string} hex - The hexadecimal string to convert.
   * @returns {Uint8Array} The resulting byte array.
   */
  hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    return this.isValidKey(key);
  }

  /**
   * Validates whether the provided key is a valid ICP private key.
   *
   * This function attempts to create a new instance of `IcpKeyPair` using the provided key.
   * If the key is valid, the function returns `true`. If the key is invalid, an error is thrown,
   * and the function returns `false`.
   *
   * @param {string} key - The private key to validate.
   * @returns {boolean} - `true` if the key is valid, `false` otherwise.
   */
  isValidKey(key: string): boolean {
    try {
      new IcpKeyPair({ prv: key });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Compresses an uncompressed public key.
   *
   * @param {string} uncompressedKey - The uncompressed public key in hexadecimal format.
   * @returns {string} - The compressed public key in hexadecimal format.
   * @throws {Error} - If the input key is not a valid uncompressed public key.
   */
  compressPublicKey(uncompressedKey: string): string {
    if (uncompressedKey.startsWith('02') || uncompressedKey.startsWith('03')) {
      return uncompressedKey;
    }
    if (!uncompressedKey.startsWith('04') || uncompressedKey.length !== 130) {
      throw new Error('Invalid uncompressed public key format.');
    }

    const xHex = uncompressedKey.slice(2, 66);
    const yHex = uncompressedKey.slice(66);
    const y = BigInt(`0x${yHex}`);
    const prefix = y % 2n === 0n ? '02' : '03';

    return `${prefix}${xHex}`;
  }

  /**
   * Derives a DfinityPrincipal from a given public key in hexadecimal format.
   *
   * @param publicKeyHex - The public key in hexadecimal format.
   * @returns The derived DfinityPrincipal.
   * @throws Will throw an error if the principal cannot be derived from the public key.
   */
  derivePrincipalFromPublicKey(publicKeyHex: string): DfinityPrincipal {
    try {
      const point = secp256k1.ProjectivePoint.fromHex(publicKeyHex);
      const uncompressedPublicKeyHex = point.toHex(false);
      const derEncodedKey = agent.wrapDER(Buffer.from(uncompressedPublicKeyHex, 'hex'), agent.SECP256K1_OID);
      const principalId = DfinityPrincipal.selfAuthenticating(Buffer.from(derEncodedKey));
      const principal = DfinityPrincipal.fromUint8Array(principalId.toUint8Array());
      return principal;
    } catch (error) {
      throw new Error(`Failed to derive principal from public key: ${error.message}`);
    }
  }

  /**
   * Converts a public key from its hexadecimal string representation to DER format.
   *
   * @param publicKeyHex - The public key in hexadecimal string format.
   * @returns The public key in DER format as a Uint8Array.
   */
  getPublicKeyInDERFormat(publicKeyHex: string): Uint8Array {
    const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    const ellipticKey = Secp256k1Curve.keyFromPublic(publicKeyBuffer);
    const uncompressedPublicKeyHex = ellipticKey.getPublic(false, 'hex');
    const derEncodedKey = agent.wrapDER(Buffer.from(uncompressedPublicKeyHex, 'hex'), agent.SECP256K1_OID);
    return derEncodedKey;
  }

  /**
   * Converts a public key in hexadecimal format to a Dfinity Principal ID.
   *
   * @param publicKeyHex - The public key in hexadecimal format.
   * @returns The corresponding Dfinity Principal ID.
   */
  getPrincipalIdFromPublicKey(publicKeyHex: string): DfinityPrincipal {
    const derEncodedKey = this.getPublicKeyInDERFormat(publicKeyHex);
    const principalId = DfinityPrincipal.selfAuthenticating(Buffer.from(derEncodedKey));
    return principalId;
  }

  /**
   * Converts a DfinityPrincipal and an optional subAccount to a string representation of an account ID.
   *
   * @param {DfinityPrincipal} principal - The principal to convert.
   * @param {Uint8Array} [subAccount=new Uint8Array(32)] - An optional sub-account, defaults to a 32-byte array of zeros.
   * @returns {string} The hexadecimal string representation of the account ID.
   */
  fromPrincipal(principal: DfinityPrincipal, subAccount: Uint8Array = new Uint8Array(32)): string {
    const ACCOUNT_ID_PREFIX = Buffer.from([0x0a, ...Buffer.from('account-id')]);
    const principalBytes = Buffer.from(principal.toUint8Array());
    const combinedBytes = Buffer.concat([ACCOUNT_ID_PREFIX, principalBytes, subAccount]);

    const sha224Hash = crypto.createHash('sha224').update(combinedBytes).digest();
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32.buf(sha224Hash) >>> 0, 0);

    const accountIdBytes = Buffer.concat([checksum, sha224Hash]);
    return accountIdBytes.toString('hex');
  }

  /**
   * Retrieves the address associated with a given hex-encoded public key.
   *
   * @param {string} hexEncodedPublicKey - The public key in hex-encoded format.
   * @returns {Promise<string>} A promise that resolves to the address derived from the provided public key.
   * @throws {Error} Throws an error if the provided public key is not in a valid hex-encoded format.
   */
  async getAddressFromPublicKey(hexEncodedPublicKey: string): Promise<string> {
    if (!this.isValidPublicKey(hexEncodedPublicKey)) {
      throw new Error('Invalid hex-encoded public key format.');
    }
    const compressedKey = this.compressPublicKey(hexEncodedPublicKey);
    const keyPair = new IcpKeyPair({ pub: compressedKey });
    return keyPair.getAddress();
  }

  /**
   * Generates a new key pair. If a seed is provided, it will be used to generate the key pair.
   *
   * @param {Buffer} [seed] - Optional seed for key generation.
   * @returns {KeyPair} - The generated key pair containing both public and private keys.
   * @throws {Error} - If the private key is missing in the generated key pair.
   */
  public generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new IcpKeyPair({ seed }) : new IcpKeyPair();
    const { pub, prv } = keyPair.getKeys();
    if (!prv) {
      throw new Error('Private key is missing in the generated key pair.');
    }
    return { pub, prv };
  }

  /**
   * Validates the raw transaction data to ensure it has a valid format in the blockchain context.
   *
   * @param {IcpTransactionData} transactionData - The transaction data to validate.
   * @throws {ParseTransactionError} If the transaction data is invalid.
   */
  validateRawTransaction(transactionData: IcpTransactionData): void {
    if (!transactionData) {
      throw new ParseTransactionError('Transaction data is missing.');
    }
    const { senderPublicKeyHex, senderAddress, receiverAddress } = transactionData;
    if (!this.isValidPublicKey(senderPublicKeyHex)) {
      throw new ParseTransactionError('Sender public key is invalid.');
    }
    if (!this.isValidAddress(senderAddress)) {
      throw new ParseTransactionError('Sender address is invalid.');
    }
    if (!this.isValidAddress(receiverAddress)) {
      throw new ParseTransactionError('Receiver address is invalid.');
    }
  }

  /**
   *
   * @param {object} update
   * @returns {Buffer}
   */
  generateHttpCanisterUpdateId(update: HttpCanisterUpdate): Buffer {
    return this.HttpCanisterUpdateRepresentationIndependentHash(update);
  }

  /**
   * Generates a representation-independent hash for an HTTP canister update.
   *
   * @param {HttpCanisterUpdate} update - The HTTP canister update object.
   * @returns {Buffer} - The hash of the update object.
   */
  HttpCanisterUpdateRepresentationIndependentHash(update: HttpCanisterUpdate): Buffer {
    const updateMap = {
      request_type: RequestType.CALL,
      canister_id: update.canister_id,
      method_name: update.method_name,
      arg: update.arg,
      ingress_expiry: update.ingress_expiry,
      sender: update.sender,
    };
    return this.hashOfMap(updateMap);
  }

  /**
   * Generates a SHA-256 hash for a given map object.
   *
   * @param {Record<string, any>} map - The map object to hash.
   * @returns {Buffer} - The resulting hash as a Buffer.
   */
  hashOfMap(map: Record<string, any>): Buffer {
    const hashes = Object.entries(map)
      .map(([key, value]) => this.hashKeyVal(key, value))
      .sort(Buffer.compare);
    return this.sha256(hashes);
  }

  /**
   * Generates a hash for a key-value pair.
   *
   * @param {string} key - The key to hash.
   * @param {string | Buffer | BigInt} val - The value to hash.
   * @returns {Buffer} - The resulting hash as a Buffer.
   */
  hashKeyVal(key: string, val: string | Buffer | BigInt): Buffer {
    const keyHash = this.hashString(key);
    const valHash = this.hashVal(val);
    return Buffer.concat([keyHash, valHash]);
  }

  /**
   * Generates a SHA-256 hash for a given string.
   *
   * @param {string} value - The string to hash.
   * @returns {Buffer} - The resulting hash as a Buffer.
   */
  hashString(value: string): Buffer {
    return this.sha256([Buffer.from(value)]);
  }

  /**
   * Generates a hash for a 64-bit unsigned integer.
   *
   * @param {bigint} n - The 64-bit unsigned integer to hash.
   * @returns {Buffer} - The resulting hash as a Buffer.
   */
  hashU64(n: bigint): Buffer {
    const buf = Buffer.allocUnsafe(10);
    let i = 0;
    while (true) {
      const byte = Number(n & BigInt(0x7f));
      n >>= BigInt(7);
      if (n === BigInt(0)) {
        buf[i] = byte;
        break;
      } else {
        buf[i] = byte | 0x80;
        ++i;
      }
    }
    return this.hashBytes(buf.subarray(0, i + 1));
  }

  /**
   * Generates a SHA-256 hash for an array of elements.
   *
   * @param {Array<any>} elements - The array of elements to hash.
   * @returns {Buffer} - The resulting hash as a Buffer.
   */
  hashArray(elements: Array<any>): Buffer {
    return this.sha256(elements.map(this.hashVal));
  }

  /**
   * Generates a hash for a given value.
   *
   * @param {string | Buffer | BigInt | number | Array<any>} val - The value to hash.
   * @returns {Buffer} - The resulting hash as a Buffer.
   * @throws {Error} - If the value type is unsupported.
   */
  hashVal(val: string | Buffer | BigInt | number | Array<any>): Buffer {
    if (typeof val === 'string') {
      return this.hashString(val);
    } else if (Buffer.isBuffer(val)) {
      return this.hashBytes(val);
    } else if (typeof val === 'bigint' || typeof val === 'number') {
      return this.hashU64(BigInt(val));
    } else if (Array.isArray(val)) {
      return this.hashArray(val);
    } else {
      throw new Error(`Unsupported value type for hashing: ${typeof val}`);
    }
  }

  /**
   * Computes the SHA-256 hash of the given buffer.
   *
   * @param value - The buffer to hash.
   * @returns The SHA-256 hash of the input buffer.
   */
  hashBytes(value: Buffer): Buffer {
    return this.sha256([value]);
  }

  /**
   * Computes the SHA-256 hash of the provided array of Buffer chunks.
   *
   * @param {Array<Buffer>} chunks - An array of Buffer objects to be hashed.
   * @returns {Buffer} - The resulting SHA-256 hash as a Buffer.
   */
  sha256(chunks: Array<Buffer>): Buffer {
    const hasher = js_sha256.sha256.create();
    chunks.forEach((chunk) => hasher.update(chunk));
    return Buffer.from(hasher.arrayBuffer());
  }

  /**
   * Converts a hexadecimal string to a Buffer.
   *
   * @param hex - The hexadecimal string to convert.
   * @returns A Buffer containing the binary data represented by the hexadecimal string.
   */
  blobFromHex(hex: string): Buffer {
    return Buffer.from(hex, 'hex');
  }

  /**
   * Converts a binary blob (Buffer) to a hexadecimal string.
   *
   * @param {Buffer} blob - The binary data to be converted.
   * @returns {string} The hexadecimal representation of the binary data.
   */
  blobToHex(blob: Buffer): string {
    return blob.toString('hex');
  }

  /**
   * Decodes a given CBOR-encoded buffer.
   *
   * @param buffer - The CBOR-encoded buffer to decode.
   * @returns The decoded data.
   */
  cborDecode(buffer: Buffer): any {
    const res = decode(buffer);
    return res;
  }

  /**
   * Generates a Buffer containing the domain IC request string.
   *
   * @returns {Buffer} A Buffer object initialized with the string '\x0Aic-request'.
   */
  getDomainICRequest(): Buffer {
    return Buffer.from('\x0Aic-request');
  }

  /**
   * Combines the domain IC request buffer with the provided message ID buffer to create signature data.
   *
   * @param {Buffer} messageId - The buffer containing the message ID.
   * @returns {Buffer} - The concatenated buffer containing the domain IC request and the message ID.
   */
  makeSignatureData(messageId: Buffer): Buffer {
    return Buffer.concat([this.getDomainICRequest(), messageId]);
  }

  /**
   * Generates a read state object from an HTTP canister update.
   *
   * @param {HttpCanisterUpdate} update - The HTTP canister update object.
   * @returns {Record<string, any>} The read state object containing the sender, paths, and ingress expiry.
   */
  makeReadStateFromUpdate(update: HttpCanisterUpdate): Record<string, any> {
    return {
      sender: update.sender,
      paths: [[Buffer.from('request_status'), this.generateHttpCanisterUpdateId(update)]],
      ingress_expiry: update.ingress_expiry,
    };
  }

  /**
   * Generates a representation-independent hash for an HTTP read state object.
   *
   * @param {Record<string, any>} readState - The HTTP read state object.
   * @returns {Buffer} - The hash of the read state object.
   */
  HttpReadStateRepresentationIndependentHash(readState: Record<string, any>): Buffer {
    return this.hashOfMap({
      request_type: RequestType.READ_STATE,
      ingress_expiry: readState.ingress_expiry,
      paths: readState.paths,
      sender: readState.sender,
    });
  }

  /**
   * Generates signatures for the given payloads using the sender's public and private keys.
   *
   * @param payloadsData - An object containing the payloads to be signed.
   * @param senderPublicKey - The public key of the sender in hexadecimal format.
   * @param senderPrivateKey - The private key of the sender in hexadecimal format.
   * @returns An array of objects, each containing the signing payload, signature type, public key, and the generated signature in hexadecimal format.
   */
  getSignatures(payloadsData: Record<string, any>, senderPublicKey: string, senderPrivateKey: string): void {
    return payloadsData.payloads.map((payload) => ({
      signing_payload: payload,
      signature_type: payload.signature_type,
      public_key: {
        hex_bytes: senderPublicKey,
        curve_type: this.getCurveType(),
      },
      hex_bytes: this.signPayload(senderPrivateKey, payload.hex_bytes),
    }));
  }

  /**
   * Signs a given payload using the provided private key.
   *
   * @param {string} privateKey - The private key to sign the payload with, in hexadecimal format.
   * @param {string} payloadHex - The payload to be signed, in hexadecimal format.
   * @returns {string} The signature of the payload, in hexadecimal format.
   */
  signPayload(privateKey: string, payloadHex: string): string {
    const ec = new EC('secp256k1');
    const key = ec.keyFromPrivate(privateKey);
    const payloadHash = crypto.createHash('sha256').update(Buffer.from(payloadHex, 'hex')).digest('hex');
    const signature = key.sign(payloadHash);
    const r = signature.r.toArray('be', 32);
    const s = signature.s.toArray('be', 32);
    return Buffer.concat([Buffer.from(r), Buffer.from(s)]).toString('hex');
  }
}

const utils = new Utils();
export default utils;
