import BigNumber from 'bignumber.js';
import crypto from 'crypto';

import { BaseUtils, isValidEd25519PublicKey, TransactionType } from '@bitgo/sdk-core';
import { coins, CantonToken } from '@bitgo/statics';

import { computePreparedTransaction } from '../../resources/hash/hash.js';
import { PreparedTransaction } from '../../resources/proto/preparedTransaction.js';

import { CryptoKeyFormat, SigningAlgorithmSpec, SigningKeySpec } from './constant';
import { PreparedTransaction as IPreparedTransaction, PreparedTxnParsedInfo } from './iface';
import { RecordField } from './resourcesInterface';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    if (!address || address.trim() === '') return false;
    const [partyHint, fingerprint] = address.trim().split('::');
    if (!fingerprint) return false;
    // all memoIds are considered valid as long as strings are passed
    const [fingerprintPart] = fingerprint.trim().split('?memoId=');
    if (!partyHint || !fingerprintPart) return false;
    return this.isValidCantonHex(fingerprintPart);
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    // In canton, there is no block hash, we store the height as the _id (hash)
    // this will be of the form, <blockHeight>_<version>
    const [height] = hash.split('_');
    const blockHeight = Number(height);
    return !isNaN(blockHeight) && blockHeight > 0;
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
   * Method to validate the input is a valid canton hex string
   * @param {String} value the hex string value
   * @returns {Boolean} true if valid
   */
  isValidCantonHex(value: string): boolean {
    const regex = /^[a-fA-F0-9]{68}$/;
    return regex.test(value);
  }

  /**
   * Helper method to convert hex value to base64
   * @param {String} hexString - hex encoded string
   * @returns {String} base64 encoded string
   */
  getBase64FromHex(hexString: string): string {
    return Buffer.from(hexString, 'hex').toString('base64');
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
   * @param {TransactionType} txType the transaction type
   * @returns {PreparedTxnParsedInfo}
   */
  parseRawCantonTransactionData(rawData: string, txType: TransactionType): PreparedTxnParsedInfo {
    const decodedData = this.decodePreparedTransaction(rawData);
    let sender = '';
    let receiver = '';
    let amount = '';
    let memoId: string | undefined;
    let instrumentId: string | undefined;
    let instrumentAdmin: string | undefined;
    let token: string | undefined;
    let preApprovalNode: RecordField[] = [];
    let transferNode: RecordField[] = [];
    let transferAcceptRejectNode: RecordField[] = [];
    const nodes = decodedData.transaction?.nodes;

    nodes?.forEach((node) => {
      const versionedNode = node.versionedNode;
      if (!versionedNode || versionedNode.oneofKind !== 'v1') return;
      const v1Node = versionedNode.v1;
      const nodeType = v1Node.nodeType;
      if (nodeType.oneofKind !== 'create') return;
      const createNode = nodeType.create;
      const template = createNode.templateId;
      const argSum = createNode.argument?.sum;
      if (!argSum || argSum.oneofKind !== 'record') return;
      const fields = argSum.record?.fields;
      if (!fields) return;
      if (
        template?.entityName === 'TransferPreapprovalProposal' &&
        !preApprovalNode.length &&
        txType === TransactionType.OneStepPreApproval
      ) {
        preApprovalNode = fields;
      }
      if (
        template?.entityName === 'Amulet' &&
        !transferAcceptRejectNode.length &&
        (txType === TransactionType.TransferAccept || txType === TransactionType.TransferReject)
      ) {
        transferAcceptRejectNode = fields;
      }
    });

    nodes?.forEach((node) => {
      const versionedNode = node.versionedNode;
      if (!versionedNode || versionedNode.oneofKind !== 'v1') return;
      const v1Node = versionedNode.v1;
      const nodeType = v1Node.nodeType;
      if (nodeType.oneofKind !== 'exercise') return;
      const exerciseNode = nodeType.exercise;
      const choiceId = exerciseNode.choiceId;
      if (!choiceId || choiceId !== 'TransferFactory_Transfer') return;
      const argSum = exerciseNode.chosenValue?.sum;
      if (!argSum || argSum.oneofKind !== 'record') return;
      const fields = argSum.record?.fields;
      if (!fields) return;
      transferNode = fields;
    });

    const getField = (fields: RecordField[], label: string) => fields.find((f) => f.label === label)?.value?.sum;

    if (preApprovalNode.length) {
      const receiverData = getField(preApprovalNode, 'receiver');
      if (receiverData?.oneofKind === 'party') receiver = receiverData.party ?? '';
      const providerData = getField(preApprovalNode, 'provider');
      if (providerData?.oneofKind === 'party') sender = providerData.party ?? '';
      amount = '0';
    } else if (transferNode.length) {
      const transferField = transferNode.find((f) => f.label === 'transfer');
      const transferSum = transferField?.value?.sum;
      if (transferSum && transferSum.oneofKind === 'record') {
        const transferRecord = transferSum.record?.fields;
        if (transferRecord?.length) {
          const senderData = getField(transferRecord, 'sender');
          if (senderData?.oneofKind === 'party') sender = senderData.party ?? '';

          const receiverData = getField(transferRecord, 'receiver');
          if (receiverData?.oneofKind === 'party') receiver = receiverData.party ?? '';

          const amountData = getField(transferRecord, 'amount');
          if (amountData?.oneofKind === 'numeric') amount = amountData.numeric ?? '';

          const instrumentField = getField(transferRecord, 'instrumentId');
          if (instrumentField?.oneofKind === 'record') {
            const instrumentFields = instrumentField.record?.fields ?? [];

            const adminData = getField(instrumentFields, 'admin');
            if (adminData?.oneofKind === 'party') {
              instrumentAdmin = adminData.party ?? '';
            }

            const idData = getField(instrumentFields, 'id');
            if (idData?.oneofKind === 'text') {
              instrumentId = idData.text ?? '';
            }
          }

          const metaField = getField(transferRecord, 'meta');
          if (metaField?.oneofKind === 'record') {
            const metaFields = metaField.record?.fields;
            if (metaFields && metaFields.length) {
              const valuesField = getField(metaFields, 'values');
              if (valuesField?.oneofKind === 'textMap') {
                const entries = valuesField.textMap?.entries ?? [];
                const memoEntry = entries.find((e) => e.key === 'splice.lfdecentralizedtrust.org/reason');
                if (memoEntry) {
                  const memoValue = memoEntry?.value?.sum;
                  if (memoValue?.oneofKind === 'text') {
                    memoId = memoValue.text;
                  }
                }
              }
            }
          }
        }
      }
    } else if (transferAcceptRejectNode.length) {
      const dsoData = getField(transferAcceptRejectNode, 'dso');
      if (dsoData?.oneofKind === 'party') sender = dsoData.party ?? '';
      const ownerData = getField(transferAcceptRejectNode, 'owner');
      if (ownerData?.oneofKind === 'party') receiver = ownerData.party ?? '';
      const amountField = getField(transferAcceptRejectNode, 'amount');
      if (amountField && amountField.oneofKind === 'record') {
        const amountRecord = amountField.record?.fields;
        if (amountRecord?.length) {
          const initialAmountData = getField(amountRecord, 'initialAmount');
          if (initialAmountData?.oneofKind === 'numeric') amount = initialAmountData.numeric ?? '';
        }
      }
    }
    if (!sender || !receiver || !amount) {
      const missingFields: string[] = [];
      if (!sender) missingFields.push('sender');
      if (!receiver) missingFields.push('receiver');
      if (!amount) missingFields.push('amount');
      throw new Error(`invalid transaction data: missing ${missingFields.join(', ')}`);
    }
    const convertedAmount = this.convertAmountToLowestUnit(new BigNumber(amount));
    const parsedData: PreparedTxnParsedInfo = {
      sender,
      receiver,
      amount: convertedAmount,
    };
    if (memoId) {
      parsedData.memoId = memoId;
    }
    if (instrumentId && instrumentAdmin) {
      token = this.findTokenNameByContractAddress(`${instrumentAdmin}:${instrumentId}`);
      parsedData.token = token;
    }
    return parsedData;
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

  async computeHashFromPrepareSubmissionResponse(preparedTransactionBase64: string): Promise<string> {
    const preparedTransaction = this.decodePreparedTransaction(preparedTransactionBase64);
    const hash = await computePreparedTransaction(preparedTransaction);
    return Buffer.from(hash).toString('base64');
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

  /**
   * Convert to canton raw units
   * @param {BigNumber} value
   * @returns {String} the converted raw canton units
   * @private
   */
  private convertAmountToLowestUnit(value: BigNumber): string {
    return value.multipliedBy(new BigNumber(10).pow(10)).toFixed(0);
  }

  /**
   * Get the bitgo token name using the on-chain instrument details
   * @param contractAddress - the contract address of the form, `instrumentAdmin:instrumentId`
   * @returns tokenName if contractAddress matches with any supported canton tokens
   */
  private findTokenNameByContractAddress(contractAddress: string): string | undefined {
    if (contractAddress.includes('Amulet')) {
      return undefined;
    }
    const cantonToken = coins
      .filter((coin) => coin instanceof CantonToken && coin.contractAddress === contractAddress)
      .map((coin) => coin as CantonToken);
    return cantonToken ? cantonToken[0].name : undefined;
  }
}

const utils = new Utils();

export default utils;
