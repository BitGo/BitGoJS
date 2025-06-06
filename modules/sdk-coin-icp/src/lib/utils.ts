import {
  BaseUtils,
  KeyPair,
  ParseTransactionError,
  Recipient,
  BuildTransactionError,
  MethodNotImplementedError,
} from '@bitgo/sdk-core';
import { Principal as DfinityPrincipal } from '@dfinity/principal';
import * as agent from '@dfinity/agent';
import crypto from 'crypto';
import crc32 from 'crc-32';
import {
  HttpCanisterUpdate,
  IcpTransactionData,
  RequestType,
  Signatures,
  MetaData,
  SendArgs,
  PayloadsData,
  CurveType,
  AccountIdentifierHash,
  CborUnsignedTransaction,
  MAX_INGRESS_TTL,
} from './iface';
import { KeyPair as IcpKeyPair } from './keyPair';
const messageCompiled = require('../../resources/messageCompiled');
const { encode, decode, Encoder } = require('cbor-x/index-no-eval'); // The "cbor-x" library is used here because it supports modern features like BigInt. do not replace it with "cbor as "cbor" is not compatible with Rust's serde_cbor when handling big numbers.
import js_sha256 from 'js-sha256';
import BigNumber from 'bignumber.js';
import { secp256k1 } from '@noble/curves/secp256k1';

//custom encoder that avoids tagging
const encoder = new Encoder({
  structuredClone: false,
  useToJSON: false,
  mapsAsObjects: false,
  largeBigIntToFloat: false,
});

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new MethodNotImplementedError();
  }

  /**
   * gets the fee data of this transaction.
   */
  feeData(): string {
    return '-10000'; // fee is static for ICP transactions as per ICP documentation
  }

  /**
   * Checks if the provided address is a valid ICP address.
   *
   * @param {string} address - The address to validate.
   * @returns {boolean} - Returns `true` if the address is valid, otherwise `false`.
   */
  isValidAddress(address: string): boolean {
    const rootAddress = this.validateMemoAndReturnRootAddress(address);
    return rootAddress !== undefined && this.isValidHash(rootAddress);
  }

  /**
   * Validates the memo ID in the address and returns the root address.
   *
   * @param {string} address - The address to validate and extract the root address from.
   * @returns {string | undefined} - The root address if valid, otherwise `undefined`.
   */
  validateMemoAndReturnRootAddress(address: string): string | undefined {
    if (!address) {
      return undefined;
    }
    const [rootAddress, memoId] = address.split('?memoId=');
    if (memoId && this.validateMemo(BigInt(memoId))) {
      return rootAddress;
    }
    return address;
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
    const principalBytes = Buffer.from(principal.toUint8Array().buffer);
    return this.getAccountIdFromPrincipalBytes(this.getAccountIdPrefix(), principalBytes, subAccount);
  }

  getAccountIdFromPrincipalBytes(
    ACCOUNT_ID_PREFIX: Buffer<ArrayBuffer>,
    principalBytes: Buffer<ArrayBufferLike>,
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

  /**
   * Validates the provided fee.
   *
   * @param {string} fee - The fee to validate.
   * @throws {BuildTransactionError} - If the fee is zero or invalid.
   */
  validateFee(fee: string): boolean {
    const feeValue = new BigNumber(fee);
    if (feeValue.isZero()) {
      throw new BuildTransactionError('Fee cannot be zero');
    }
    return true;
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): boolean {
    if (value.isLessThanOrEqualTo(0)) {
      throw new BuildTransactionError('amount cannot be less than or equal to zero');
    }
    return true;
  }

  /**
   * Validates the provided memo.
   *
   * @param {number | BigInt} memo - The memo to validate.
   * @returns {boolean} - Returns `true` if the memo is valid.
   * @throws {BuildTransactionError} - If the memo is invalid.
   */
  validateMemo(memo: number | BigInt): boolean {
    const memoNumber = Number(memo);
    if (memoNumber < 0 || Number.isNaN(memoNumber)) {
      throw new BuildTransactionError('Invalid memo');
    }
    return true;
  }

  validateExpireTime(expireTime: number | BigInt): boolean {
    if (Number(expireTime) < Date.now() * 1000_000) {
      throw new BuildTransactionError('Invalid expiry time');
    }
    return true;
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
    if (senderPublicKeyHex && !this.isValidPublicKey(senderPublicKeyHex)) {
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
    } else if (Buffer.isBuffer(val) || val instanceof Uint8Array) {
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
  hashBytes(value: Buffer | Uint8Array): Buffer {
    return this.sha256([value]);
  }

  /**
   * Computes the SHA-256 hash of the provided array of Buffer chunks.
   *
   * @param {Array<Buffer>} chunks - An array of Buffer objects to be hashed.
   * @returns {Buffer} - The resulting SHA-256 hash as a Buffer.
   */
  sha256(chunks: Array<Buffer> | Array<Uint8Array>): Buffer {
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

  getMetaData(
    memo: number | BigInt,
    timestamp: number | bigint | undefined,
    ingressEnd: number | BigInt | undefined
  ): { metaData: MetaData; ingressEndTime: number | BigInt } {
    let currentTime = Date.now() * 1000000;
    if (timestamp) {
      currentTime = Number(timestamp);
    }
    let ingressStartTime: number, ingressEndTime: number;
    if (ingressEnd) {
      ingressEndTime = Number(ingressEnd);
      ingressStartTime = ingressEndTime - MAX_INGRESS_TTL; // 5 mins in nanoseconds
    } else {
      ingressStartTime = currentTime;
      ingressEndTime = ingressStartTime + MAX_INGRESS_TTL; // 5 mins in nanoseconds
    }
    const metaData: MetaData = {
      created_at_time: currentTime,
      ingress_start: ingressStartTime,
      ingress_end: ingressEndTime,
      memo: memo,
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

  fromArgs(arg: Uint8Array): SendArgs {
    const SendRequestMessage = messageCompiled.SendRequest;
    const args = SendRequestMessage.decode(arg) as unknown as SendArgs;
    const transformedArgs: SendArgs = {
      payment: { receiverGets: { e8s: Number(args.payment.receiverGets.e8s) } },
      maxFee: { e8s: Number(args.maxFee.e8s) },
      to: { hash: Buffer.from(args.to.hash) },
      createdAtTime: { timestampNanos: BigNumber(args.createdAtTime.timestampNanos.toString()).toNumber() },
      memo: { memo: Number(args.memo.memo.toString()) },
    };
    return transformedArgs;
  }

  async toArg(args: SendArgs): Promise<Uint8Array> {
    const SendRequestMessage = messageCompiled.SendRequest;
    const errMsg = SendRequestMessage.verify(args);
    if (errMsg) throw new Error(errMsg);
    const message = SendRequestMessage.create(args as any);
    return SendRequestMessage.encode(message).finish();
  }

  getAccountIdPrefix(): Buffer<ArrayBuffer> {
    return Buffer.from([0x0a, ...Buffer.from('account-id')]);
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    // ICP block hashes are 64-character hexadecimal strings
    return this.isValidHash(hash);
  }

  /**
   * Returns whether or not the string is a valid ICP hash
   *
   * @param {string} hash - string to validate
   * @returns {boolean}
   */
  isValidHash(hash: string): boolean {
    return typeof hash === 'string' && /^[0-9a-fA-F]{64}$/.test(hash);
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return this.isValidHash(txId);
  }

  getSignatures(payloadsData: PayloadsData, senderPublicKey: string, senderPrivateKey: string): Signatures[] {
    return payloadsData.payloads.map((payload) => ({
      signing_payload: payload,
      signature_type: payload.signature_type,
      public_key: {
        hex_bytes: senderPublicKey,
        curve_type: CurveType.SECP256K1,
      },
      hex_bytes: this.signPayload(senderPrivateKey, payload.hex_bytes),
    }));
  }

  signPayload = (privateKey: string, payloadHex: string): string => {
    const privateKeyBytes = Buffer.from(privateKey, 'hex');
    const payloadHash = crypto.createHash('sha256').update(Buffer.from(payloadHex, 'hex')).digest('hex');
    const signature = secp256k1.sign(payloadHash, privateKeyBytes);
    const r = Buffer.from(signature.r.toString(16).padStart(64, '0'), 'hex');
    const s = Buffer.from(signature.s.toString(16).padStart(64, '0'), 'hex');
    return Buffer.concat([r, s]).toString('hex');
  };

  getTransactionId(unsignedTransaction: string, senderAddress: string, receiverAddress: string): string {
    try {
      const decodedTxn = utils.cborDecode(utils.blobFromHex(unsignedTransaction)) as CborUnsignedTransaction;
      const updates = decodedTxn.updates as unknown as [string, HttpCanisterUpdate][];
      for (const [, update] of updates) {
        const updateArgs = update.arg;
        const sendArgs = utils.fromArgs(updateArgs);
        const transactionHash = this.generateTransactionHash(sendArgs, senderAddress, receiverAddress);
        return transactionHash;
      }
      throw new Error('No updates found in the unsigned transaction.');
    } catch (error) {
      throw new Error(`Unable to compute transaction ID: ${error.message}`);
    }
  }

  safeBigInt(value: unknown): number | bigint {
    if (typeof value === 'bigint') {
      return value;
    }

    if (typeof value === 'number') {
      const MAX_32BIT = 4294967295; // 2^32 - 1
      const MIN_32BIT = -4294967296; // -(2^32)
      const isOutside32BitRange = value > MAX_32BIT || value < MIN_32BIT;
      return isOutside32BitRange ? BigInt(value) : value;
    }

    throw new Error(`Invalid type: expected a number or bigint, but received ${typeof value}`);
  }

  generateTransactionHash(sendArgs: SendArgs, senderAddress: string, receiverAddress: string): string {
    const senderAccount = this.accountIdentifier(senderAddress);
    const receiverAccount = this.accountIdentifier(receiverAddress);

    const transferFields = new Map<any, any>([
      [0, senderAccount],
      [1, receiverAccount],
      [2, new Map([[0, this.safeBigInt(sendArgs.payment.receiverGets.e8s)]])],
      [3, new Map([[0, sendArgs.maxFee.e8s]])],
    ]);

    const operationMap = new Map([[2, transferFields]]);
    const txnFields = new Map<any, any>([
      [0, operationMap],
      [1, this.safeBigInt(sendArgs.memo.memo)],
      [2, new Map([[0, BigInt(sendArgs.createdAtTime.timestampNanos)]])],
    ]);

    const processedTxn = this.getProcessedTransactionMap(txnFields);
    const serializedTxn = encoder.encode(processedTxn);
    return crypto.createHash('sha256').update(serializedTxn).digest('hex');
  }

  accountIdentifier(accountAddress: string): AccountIdentifierHash {
    const bytes = Buffer.from(accountAddress, 'hex');
    if (bytes.length === 32) {
      return { hash: bytes.slice(4) };
    }
    throw new Error(`Invalid AccountIdentifier: 64 hex chars, got ${accountAddress.length}`);
  }

  getProcessedTransactionMap(txnMap: Map<any, any>): Map<any, any> {
    const operationMap = txnMap.get(0);
    const transferMap = operationMap.get(2);
    transferMap.set(0, this.serializeAccountIdentifier(transferMap.get(0)));
    transferMap.set(1, this.serializeAccountIdentifier(transferMap.get(1)));
    return txnMap;
  }

  serializeAccountIdentifier(accountHash: AccountIdentifierHash): string {
    if (accountHash && accountHash.hash) {
      const hashBuffer = accountHash.hash;
      const checksum = Buffer.alloc(4);
      checksum.writeUInt32BE(crc32.buf(hashBuffer) >>> 0, 0);
      return Buffer.concat([checksum, hashBuffer]).toString('hex').toLowerCase();
    }
    throw new Error('Invalid accountHash format');
  }
}

const utils = new Utils();
export default utils;
