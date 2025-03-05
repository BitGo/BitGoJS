import { BaseUtils, KeyPair, ParseTransactionError, Recipient, BuildTransactionError } from '@bitgo/sdk-core';
import { Principal as DfinityPrincipal } from '@dfinity/principal';
import * as agent from '@dfinity/agent';
import crypto from 'crypto';
import crc32 from 'crc-32';
import {
  HttpCanisterUpdate,
  IcpTransactionData,
  ReadState,
  RequestType,
  Signatures,
  IcpMetadata,
  SendArgs,
} from './iface';
import { KeyPair as IcpKeyPair } from './keyPair';
import { decode, encode } from 'cbor-x'; // The "cbor-x" library is used here because it supports modern features like BigInt. do not replace it with "cbor as "cbor" is not compatible with Rust's serde_cbor when handling big numbers.
import js_sha256 from 'js-sha256';
import BigNumber from 'bignumber.js';
import { secp256k1 } from '@noble/curves/secp256k1';
import protobuf from 'protobufjs';
import { protoDefinition } from './protoDefinition';

export const REQUEST_STATUS = 'request_status';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * gets the gas data of this transaction.
   */
  //TODO WIN-4242: to moved to a config and eventually to an API for dynamic value
  gasData(): string {
    return '-10000';
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
   * @param {unknown} value - The value to encode.
   * @returns {string} - The CBOR encoded value as a hex string.
   */
  cborEncode(value: unknown): string {
    if (value === undefined) {
      throw new Error('Value to encode cannot be undefined.');
    }
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
   * Converts a public key from its hexadecimal string representation to DER format.
   *
   * @param {string} publicKeyHex - The public key in hexadecimal string format.
   * @returns The public key in DER format as a Uint8Array.
   */
  getPublicKeyInDERFormat(publicKeyHex: string): Uint8Array {
    const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    const ellipticKey = secp256k1.ProjectivePoint.fromHex(publicKeyBuffer.toString('hex'));
    const uncompressedPublicKeyHex = ellipticKey.toHex(false);
    const derEncodedKey = agent.wrapDER(Buffer.from(uncompressedPublicKeyHex, 'hex'), agent.SECP256K1_OID);
    return derEncodedKey;
  }

  /**
   * Converts a public key in hexadecimal format to a Dfinity Principal ID.
   *
   * @param {string} publicKeyHex - The public key in hexadecimal format.
   * @returns The corresponding Dfinity Principal ID.
   */
  getPrincipalIdFromPublicKey(publicKeyHex: string): DfinityPrincipal {
    const derEncodedKey = this.getPublicKeyInDERFormat(publicKeyHex);
    const principalId = DfinityPrincipal.selfAuthenticating(Buffer.from(derEncodedKey));
    return principalId;
  }

  /**
   * Derives a DfinityPrincipal from a given public key in hexadecimal format.
   *
   * @param {string} publicKeyHex - The public key in hexadecimal format.
   * @returns The derived DfinityPrincipal.
   * @throws Will throw an error if the principal cannot be derived from the public key.
   */
  derivePrincipalFromPublicKey(publicKeyHex: string): DfinityPrincipal {
    try {
      const derEncodedKey = this.getPublicKeyInDERFormat(publicKeyHex);
      const principalId = DfinityPrincipal.selfAuthenticating(Buffer.from(derEncodedKey));
      const principal = DfinityPrincipal.fromUint8Array(principalId.toUint8Array());
      return principal;
    } catch (error) {
      throw new Error(`Failed to derive principal from public key: ${error.message}`);
    }
  }

  /**
   * Converts a DfinityPrincipal and an optional subAccount to a string representation of an account ID.
   *
   * @param {DfinityPrincipal} principal - The principal to convert.
   * @param {Uint8Array} [subAccount=new Uint8Array(32)] - An optional sub-account, defaults to a 32-byte array of zeros.
   * @returns {string} The hexadecimal string representation of the account ID.
   */
  fromPrincipal(principal: DfinityPrincipal, subAccount: Uint8Array = new Uint8Array(32)): string {
    const principalBytes = Buffer.from(principal.toUint8Array());
    return this.getAccountIdFromPrincipalBytes(this.getAccountIdPrefix(), principalBytes, subAccount);
  }

  getAccountIdFromPrincipalBytes(
    ACCOUNT_ID_PREFIX: Buffer<ArrayBuffer>,
    principalBytes: Buffer<Uint8Array<ArrayBufferLike>>,
    subAccount: Uint8Array<ArrayBufferLike>
  ): string {
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

  validateFee(fee: string): void {
    if (new BigNumber(fee).isEqualTo(0)) {
      throw new BuildTransactionError('Fee equal to zero');
    }
    if (fee !== this.gasData()) {
      throw new BuildTransactionError('Invalid fee value');
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThanOrEqualTo(0)) {
      throw new BuildTransactionError('amount cannot be less than or equal to zero');
    }
  }

  validateMemo(memo: number | BigInt): void {
    if (Number(memo) < 0 || Number(memo) === null || Number(memo) === undefined || Number.isNaN(Number(memo))) {
      throw new BuildTransactionError('Invalid memo');
    }
  }

  validateExpireTime(expireTime: number | BigInt): void {
    if (Number(expireTime) < Date.now() * 1000_000) {
      throw new BuildTransactionError('Invalid expiry time');
    }
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
    this.validateFee(transactionData.fee);
    this.validateValue(new BigNumber(transactionData.amount));
    this.validateMemo(transactionData.memo);
    this.validateExpireTime(transactionData.expiryTime);
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
   * @param {Record<string, unknown>} map - The map object to hash.
   * @returns {Buffer} - The resulting hash as a Buffer.
   */
  hashOfMap(map: Record<string, any>): Buffer {
    const hashes: Buffer[] = [];
    for (const key in map) {
      hashes.push(this.hashKeyVal(key, map[key]));
    }
    hashes.sort((buf0, buf1) => buf0.compare(buf1));
    return this.sha256(hashes);
  }

  /**
   * Generates a hash for a key-value pair.
   *
   * @param {string} key - The key to hash.
   * @param {string | Buffer | BigInt} val - The value to hash.
   * @returns {Buffer} - The resulting hash as a Buffer.
   */
  hashKeyVal(key: string, val: any): Buffer {
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
   * @param {string | Buffer | BigInt | number | Array<unknown>} val - The value to hash.
   * @returns {Buffer} - The resulting hash as a Buffer.
   * @throws {Error} - If the value type is unsupported.
   */
  hashVal(val: string | Buffer | BigInt | number | Array<unknown>): Buffer {
    if (typeof val === 'string') {
      return utils.hashString(val);
    } else if (Buffer.isBuffer(val)) {
      return utils.hashBytes(val);
    } else if (typeof val === 'bigint' || typeof val === 'number') {
      return utils.hashU64(BigInt(val));
    } else if (Array.isArray(val)) {
      return utils.hashArray(val);
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
  cborDecode(buffer: Buffer): unknown {
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
   * @returns {ReadState} The read state object containing the sender, paths, and ingress expiry.
   */
  makeReadStateFromUpdate(update: HttpCanisterUpdate): ReadState {
    return {
      sender: update.sender,
      paths: [[Buffer.from(REQUEST_STATUS), this.generateHttpCanisterUpdateId(update)]],
      ingress_expiry: update.ingress_expiry,
    };
  }

  /**
   * Generates a representation-independent hash for an HTTP read state object.
   *
   * @param {ReadState} readState - The HTTP read state object.
   * @returns {Buffer} - The hash of the read state object.
   */
  HttpReadStateRepresentationIndependentHash(readState: ReadState): Buffer {
    return this.hashOfMap({
      request_type: RequestType.READ_STATE,
      ingress_expiry: readState.ingress_expiry,
      paths: readState.paths,
      sender: readState.sender,
    });
  }

  /**
   * Extracts the recipient information from the provided ICP transaction data.
   *
   * @param {IcpTransactionData} icpTransactionData - The ICP transaction data containing the receiver's address and amount.
   * @returns {Recipient[]} An array containing a single recipient object with the receiver's address and amount.
   */
  getRecipients(icpTransactionData: IcpTransactionData): Recipient {
    return {
      address: icpTransactionData.receiverAddress,
      amount: icpTransactionData.amount,
    };
  }

  getTransactionSignature(signatureMap: Map<string, Signatures>, update: HttpCanisterUpdate): Signatures | undefined {
    return signatureMap.get(this.blobToHex(this.makeSignatureData(this.generateHttpCanisterUpdateId(update))));
  }

  getReadStateSignature(signatureMap: Map<string, Signatures>, readState: ReadState): Signatures | undefined {
    return signatureMap.get(
      this.blobToHex(this.makeSignatureData(this.HttpReadStateRepresentationIndependentHash(readState)))
    );
  }

  getMetaData(memo: number | BigInt): { metaData: IcpMetadata; ingressEndTime: number | BigInt } {
    const currentTime = Date.now() * 1000000;
    const ingressStartTime = currentTime;
    const ingressEndTime = ingressStartTime + 5 * 60 * 1000000000; // 5 mins in nanoseconds
    const metaData: IcpMetadata = {
      created_at_time: currentTime,
      memo: memo,
      ingress_start: ingressStartTime,
      ingress_end: ingressEndTime,
    };
    return { metaData, ingressEndTime };
  }

  convertSenderBlobToPrincipal(senderBlob: Uint8Array): Uint8Array {
    const MAX_LENGTH_IN_BYTES = 29;
    if (senderBlob.length > MAX_LENGTH_IN_BYTES) {
      throw new Error('Bytes too long for a valid Principal');
    }
    const principalBytes = new Uint8Array(MAX_LENGTH_IN_BYTES);
    principalBytes.set(senderBlob.slice(0, senderBlob.length));
    return principalBytes;
  }

  async fromArgs(arg: Uint8Array): Promise<SendArgs> {
    const root = protobuf.parse(protoDefinition).root;
    const SendRequestMessage = root.lookupType('SendRequest');
    const args = SendRequestMessage.decode(arg) as unknown as SendArgs;
    const transformedArgs: SendArgs = {
      memo: { memo: BigInt(args.memo.memo.toString()) },
      payment: { receiverGets: { e8s: args.payment.receiverGets.e8s } },
      maxFee: { e8s: args.maxFee.e8s },
      to: { hash: Buffer.from(args.to.hash) },
      createdAtTime: { timestampNanos: BigNumber(args.createdAtTime.timestampNanos.toString()).toNumber() },
    };
    return transformedArgs;
  }

  async toArg(args: SendArgs): Promise<Uint8Array> {
    const root = protobuf.parse(protoDefinition).root;
    const SendRequestMessage = root.lookupType('SendRequest');
    const errMsg = SendRequestMessage.verify(args);
    if (errMsg) throw new Error(errMsg);
    const message = SendRequestMessage.create(args);
    return SendRequestMessage.encode(message).finish();
  }

  getAccountIdPrefix(): Buffer<ArrayBuffer> {
    return Buffer.from([0x0a, ...Buffer.from('account-id')]);
  }
}

const utils = new Utils();
export default utils;
