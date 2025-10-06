import crypto from 'crypto';

import { BaseUtils, isValidEd25519PublicKey } from '@bitgo/sdk-core';

import { PreparedTransaction } from '../../resources/proto/preparedTransaction.js';

import { CryptoKeyFormat, SigningAlgorithmSpec, SigningKeySpec } from './constant';
import { PreparedTransaction as IPreparedTransaction, PreparedTxnParsedInfo } from './iface';
import { RecordField } from './resourcesInterface';

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
   * Method to create fingerprint (part of the canton partyId) from public key
   * @param {String} publicKey the public key
   * @returns {String}
   */
  getAddressFromPublicKey(publicKey: string): string {
    const key = this.signingPublicKeyFromEd25519(publicKey);
    const hashPurpose = 12;
    return this.computeSha256CantonHash(hashPurpose, key.publicKey);
  }

  /**
   * Method to parse raw canton transaction & get required data
   * @param {String} rawData base64 encoded string
   * @returns {PreparedTxnParsedInfo}
   */
  parseRawCantonTransactionData(rawData: string): PreparedTxnParsedInfo {
    const decodedData = this.decodePreparedTransaction(rawData);
    let sender = '';
    let receiver = '';
    let amount = '';
    decodedData.transaction?.nodes?.forEach((node) => {
      const versionedNode = node.versionedNode;
      if (!versionedNode || versionedNode.oneofKind !== 'v1') return;

      const v1Node = versionedNode.v1;
      const nodeType = v1Node.nodeType;

      if (nodeType.oneofKind !== 'create') return;

      const createNode = nodeType.create;

      // Check if it's the correct template
      const template = createNode.templateId;
      if (template?.entityName !== 'AmuletTransferInstruction') return;

      // Now parse the 'create' argument
      if (createNode.argument?.sum?.oneofKind !== 'record') return;
      const fields = createNode.argument?.sum?.record?.fields;
      if (!fields) return;

      // Find the 'transfer' field
      const transferField = fields.find((f) => f.label === 'transfer');
      if (transferField?.value?.sum?.oneofKind !== 'record') return;
      const transferRecord = transferField?.value?.sum?.record?.fields;
      if (!transferRecord) return;

      const getField = (fields: RecordField[], label: string) => fields.find((f) => f.label === label)?.value?.sum;

      const senderData = getField(transferRecord, 'sender');
      if (!senderData || senderData.oneofKind !== 'party') return;
      sender = senderData.party;
      const receiverData = getField(transferRecord, 'receiver');
      if (!receiverData || receiverData.oneofKind !== 'party') return;
      receiver = receiverData.party;
      const amountData = getField(transferRecord, 'amount');
      if (!amountData || amountData.oneofKind !== 'numeric') return;
      amount = amountData.numeric;
    });
    if (!sender || !receiver || !amount) {
      const missingFields: string[] = [];
      if (!sender) missingFields.push('sender');
      if (!receiver) missingFields.push('receiver');
      if (!amount) missingFields.push('amount');
      throw new Error(`invalid transaction data: missing ${missingFields.join(', ')}`);
    }
    return {
      sender,
      receiver,
      amount,
    };
  }

  /**
   * Computes the topology hash from the API response of the 'create party' endpoint.
   *
   * @param topologyTransactions - List of base64-encoded topology transactions from the Canton API.
   * @returns The final base64-encoded topology transaction hash.
   */
  computeHashFromCreatePartyResponse(topologyTransactions: string[]): string {
    const txBuffers = topologyTransactions.map((tx) => Buffer.from(tx, 'base64'));
    return this.computeHashFromTopologyTransaction(txBuffers);
  }

  /**
   * Computes the final topology transaction hash for a list of prepared Canton transactions.
   *
   * Each transaction is first hashed with purpose `11`, then all hashes are combined and
   * hashed again with purpose `55`, following the Canton topology hash rules.
   *
   * The resulting hash is encoded as a base64 string.
   *
   * @param {Buffer[]} preparedTransactions - An array of Canton transaction buffers.
   * @returns {string} The final topology hash, base64-encoded.
   */
  private computeHashFromTopologyTransaction(preparedTransactions: Buffer[]): string {
    const rawHashes = preparedTransactions.map((tx) => this.computeSha256CantonHash(11, tx));
    const combinedHashes = this.computeMultiHashForTopology(rawHashes);
    const computedHash = this.computeSha256CantonHash(55, combinedHashes);
    return Buffer.from(computedHash, 'hex').toString('base64');
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
   * Decodes a Base64-encoded string into a Uint8Array
   * @param {String} b64 The Base64-encoded string
   * @returns {Uint8Array} The decoded byte array
   * @private
   */
  private fromBase64(b64: string): Uint8Array {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }

  /**
   * Decodes a Base64-encoded prepared transaction into a structured object
   * @param {String} base64 The Base64-encoded transaction data
   * @returns {IPreparedTransaction} The decoded `IPreparedTransaction` object
   * @private
   */
  private decodePreparedTransaction(base64: string): IPreparedTransaction {
    const bytes = this.fromBase64(base64);
    return PreparedTransaction.fromBinary(bytes);
  }

  /**
   * Computes a deterministic combined hash from an array of individual Canton-style SHA-256 hashes
   *
   * Each hash is decoded from hex, sorted lexicographically (by hex), and prefixed with its length
   * The final buffer includes the number of hashes followed by each (length-prefixed) hash
   *
   * @param {string[]} hashes - An array of Canton-prefixed SHA-256 hashes in hexadecimal string format
   * @returns {Buffer} A binary buffer representing the combined hash input
   */
  private computeMultiHashForTopology(hashes: string[]): Buffer {
    const sortedHashes = hashes
      .map((hex) => Buffer.from(hex, 'hex'))
      .sort((a, b) => a.toString('hex').localeCompare(b.toString('hex')));

    const numHashesBytes = this.encodeInt32(sortedHashes.length);
    const parts: Buffer[] = [numHashesBytes];

    for (const h of sortedHashes) {
      const lengthBytes = this.encodeInt32(h.length);
      parts.push(lengthBytes, h);
    }

    return Buffer.concat(parts);
  }

  /**
   * Encodes a 32-bit signed integer into a 4-byte big-endian Buffer
   *
   * @param {number} value - The integer to encode
   * @returns {Buffer} A 4-byte buffer representing the integer in big-endian format
   */
  private encodeInt32(value: number): Buffer {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(value, 0);
    return buf;
  }
}

const utils = new Utils();

export default utils;
