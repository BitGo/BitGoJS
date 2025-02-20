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
  isValidAddress(address: string): boolean {
    if (!address) {
      return false;
    }
    const hexRegex = /^[0-9a-fA-F]{64}$/;
    return hexRegex.test(address);
  }

  isValidTransactionId(txId: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidPublicKey(hexStr: string): boolean {
    if (!this.isValidHex(hexStr)) {
      return false;
    }

    if (!this.isValidLength(hexStr)) {
      return false;
    }

    const pubKeyBytes = this.hexToBytes(hexStr);
    const firstByte = pubKeyBytes[0];
    return (
      (pubKeyBytes.length === 33 && (firstByte === 2 || firstByte === 3)) ||
      (pubKeyBytes.length === 65 && firstByte === 4)
    );
  }

  getTransactionType(): string {
    return 'TRANSACTION';
  }

  /**
   *
   * @param {any} value
   * @returns {Buffer}
   */
  cbor_encode(value) {
    const cborData = encode(value);
    return Buffer.from(cborData).toString('hex');
  }

  getFeeType(): string {
    return 'FEE';
  }

  isValidLength(hexStr: string): boolean {
    const byteLength = hexStr.length / 2; // Convert hex length to byte length
    if (byteLength === 33 || byteLength === 65) {
      return true;
    }

    return false;
  }

  isValidHex(hexStr: string): boolean {
    return /^([0-9a-fA-F]{2})+$/.test(hexStr);
  }

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

  isValidKey(key: string): boolean {
    try {
      new IcpKeyPair({ prv: key });
      return true;
    } catch {
      return false;
    }
  }

  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidBlockId(hash: string): boolean {
    throw new Error('Method not implemented.');
  }

  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  getNetwork(): string {
    return '00000000000000020101';
  }

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

    return prefix + xHex;
  }

  getCurveType(): string {
    return 'secp256k1';
  }

  derivePrincipalFromPublicKey(publicKeyHex: string): DfinityPrincipal {
    try {
      const point = secp256k1.ProjectivePoint.fromHex(publicKeyHex);
      const uncompressedPublicKeyHex = point.toHex(false);
      const derEncodedKey = agent.wrapDER(Buffer.from(uncompressedPublicKeyHex, 'hex'), agent.SECP256K1_OID);
      const principalId = DfinityPrincipal.selfAuthenticating(Buffer.from(derEncodedKey));
      const principal = DfinityPrincipal.fromUint8Array(principalId.toUint8Array());
      return principal;
    } catch (error) {
      throw new Error(`Failed to process the public key: ${error.message}`);
    }
  }

  getPublicKeyInDERFormat(publicKeyHex: string): Uint8Array {
    const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    const ellipticKey = Secp256k1Curve.keyFromPublic(publicKeyBuffer);
    const uncompressedPublicKeyHex = ellipticKey.getPublic(false, 'hex');
    const derEncodedKey = agent.wrapDER(Buffer.from(uncompressedPublicKeyHex, 'hex'), agent.SECP256K1_OID);
    return derEncodedKey;
  }

  getPrincipalIdFromPublicKey(publicKeyHex: string): DfinityPrincipal {
    const derEncodedKey = this.getPublicKeyInDERFormat(publicKeyHex);
    const principalId = DfinityPrincipal.selfAuthenticating(Buffer.from(derEncodedKey));
    return principalId;
  }

  fromPrincipal(principal: DfinityPrincipal, subAccount: Uint8Array = new Uint8Array(32)): string {
    const ACCOUNT_ID_PREFIX = new Uint8Array([0x0a, ...Buffer.from('account-id')]);
    const principalBytes = principal.toUint8Array();
    const combinedBytes = new Uint8Array(ACCOUNT_ID_PREFIX.length + principalBytes.length + subAccount.length);

    combinedBytes.set(ACCOUNT_ID_PREFIX, 0);
    combinedBytes.set(principalBytes, ACCOUNT_ID_PREFIX.length);
    combinedBytes.set(subAccount, ACCOUNT_ID_PREFIX.length + principalBytes.length);

    const sha224Hash = crypto.createHash('sha224').update(combinedBytes).digest();
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32.buf(sha224Hash) >>> 0, 0);

    const accountIdBytes = Buffer.concat([checksum, sha224Hash]);
    return accountIdBytes.toString('hex');
  }

  async getAddressFromPublicKey(hexEncodedPublicKey: string): Promise<string> {
    const isKeyValid = this.isValidPublicKey(hexEncodedPublicKey);
    if (!isKeyValid) {
      throw new Error('Public Key is not in a valid Hex Encoded Format');
    }
    const compressedKey = this.compressPublicKey(hexEncodedPublicKey);
    const KeyPair = new IcpKeyPair({ pub: compressedKey });
    return KeyPair.getAddress();
  }

  public generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new IcpKeyPair({ seed }) : new IcpKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {string} transactionData - Transaction data in JSON format
   */
  validateRawTransaction(transactionData: IcpTransactionData): void {
    if (!transactionData) {
      throw new ParseTransactionError('Invalid transaction data');
    }
    if (!this.isValidPublicKey(transactionData.senderPublicKeyHex)) {
      throw new ParseTransactionError('Invalid sender public key');
    }
    if (!this.isValidAddress(transactionData.senderAddress)) {
      throw new ParseTransactionError('Invalid sender address');
    }
    if (!this.isValidAddress(transactionData.receiverAddress)) {
      throw new ParseTransactionError('Invalid receiver address');
    }
  }

  /**
   *
   * @param {object} update
   * @returns {Buffer}
   */
  HttpCanisterUpdateId(update: HttpCanisterUpdate): Buffer {
    return this.HttpCanisterUpdateRepresentationIndependentHash(update);
  }

  /**
   *
   * @param {object} update
   * @returns {Buffer}
   */
  HttpCanisterUpdateRepresentationIndependentHash(update: HttpCanisterUpdate): Buffer {
    return this.hashOfMap({
      request_type: RequestType.CALL,
      canister_id: update.canister_id,
      method_name: update.method_name,
      arg: update.arg,
      ingress_expiry: update.ingress_expiry,
      sender: update.sender,
    });
  }

  /**
   *
   * @param {object} map
   * @returns {Buffer}
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
   *
   * @param {string} key
   * @param {string|Buffer|BigInt} val
   * @returns {Buffer}
   */
  hashKeyVal(key: string, val: string | Buffer | BigInt): Buffer {
    return Buffer.concat([this.hashString(key), this.hashVal(val)]);
  }

  /**
   *
   * @param {string} value
   * @returns {Buffer}
   */
  hashString(value: string): Buffer {
    return this.sha256([Buffer.from(value)]);
  }

  /**
   *
   * @param {BigInt} n
   * @returns {Buffer}
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
   *
   * @param {Array<any>} elements
   * @returns {Buffer}
   */
  hashArray(elements: Array<any>): Buffer {
    return this.sha256(elements.map(this.hashVal));
  }

  /**
   *
   * @param {string|Buffer|BigInt} val
   * @returns {Buffer}
   */
  hashVal(val: string | Buffer | BigInt): Buffer {
    if (typeof val === 'string') {
      return this.hashString(val);
    }
    if (Buffer.isBuffer(val)) {
      return this.hashBytes(val);
    }
    if (typeof val === 'bigint') {
      return this.hashU64(val);
    }
    if (typeof val === 'number') {
      return this.hashU64(BigInt(val));
    }
    if (Array.isArray(val)) {
      return this.hashArray(val);
    }
    throw new Error(`hashVal(${val}) unsupported`);
  }

  /**
   *
   * @param {Buffer} value
   * @returns {Buffer}
   */
  hashBytes(value: Buffer): Buffer {
    return this.sha256([value]);
  }

  /**
   *
   * @param {Array<Buffer>} chunks
   * @returns {Buffer}
   */
  sha256(chunks: Array<Buffer>): Buffer {
    const hasher = js_sha256.sha256.create();
    chunks.forEach((chunk) => hasher.update(chunk));
    return Buffer.from(hasher.arrayBuffer());
  }

  blobFromHex(hex: string): Buffer {
    return Buffer.from(hex, 'hex');
  }

  blobToHex(blob: Buffer): string {
    return blob.toString('hex');
  }

  /**
   *
   * @param {Buffer} buffer
   * @returns {any}
   */
  cborDecode(buffer: Buffer): any {
    const res = decode(buffer);
    return res;
  }

  getDomainICRequest(): Buffer {
    return Buffer.from('\x0Aic-request');
  }

  /**
   *
   * @param {Buffer} messageId
   * @returns {Buffer}
   */
  makeSignatureData(messageId: Buffer): Buffer {
    return Buffer.concat([this.getDomainICRequest(), messageId]);
  }

  /**
   *
   * @param {object} update
   * @returns {object}
   */
  makeReadStateFromUpdate(update: HttpCanisterUpdate): Record<string, any> {
    return {
      sender: update.sender,
      paths: [[Buffer.from('request_status'), this.HttpCanisterUpdateId(update)]],
      ingress_expiry: update.ingress_expiry,
    };
  }

  /**
   *
   * @param {object} readState
   * @returns {Buffer}
   */
  HttpReadStateRepresentationIndependentHash(readState: Record<string, any>): Buffer {
    return this.hashOfMap({
      request_type: RequestType.READ_STATE,
      ingress_expiry: readState.ingress_expiry,
      paths: readState.paths,
      sender: readState.sender,
    });
  }

  getSignatureType(): string {
    return 'ecdsa';
  }

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
