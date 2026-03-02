import { RLP } from '@ethereumjs/rlp';
import { arrayify, keccak256 } from 'ethers/lib/utils';
import request from 'superagent';
import {
  CommitmentType,
  CommitmentTypeId,
  CommitmentTransactionFields,
  CommitmentTransactionBuildResult,
  EncodedSignedCommitmentTransaction,
  EncodedCommitmentType,
  AnchorInfo,
  COMMITMENT_TX_VERSION,
} from './iface';
import { encodeBase58, decodeBase58ToFixed, hexAddressToBytes } from './utils';

/** String commitment type for the standard coin API (e.g. wallet-platform) */
export type CommitmentTypeString = 'STAKE' | 'PLEDGE';

/**
 * Builder for Irys commitment transactions (STAKE, PLEDGE).
 *
 * Commitment transactions are NOT standard EVM transactions. They use a custom
 * 7-field RLP encoding with keccak256 prehash and raw ECDSA signing.
 *
 * Usage (standard coin pattern, e.g. from TransactionBuilderFactory):
 *   const builder = factory.getCommitmentTransactionBuilder();
 *   builder.setCommitmentType('STAKE').setSigner(hexAddress).setFee('1000').setValue('5000');
 *   const result = await builder.build(); // { serializedTxHex, signableHex, fields, coinSpecific }
 *
 * Usage (low-level, for tests or advanced use):
 *   builder.setCommitmentType({ type: CommitmentTypeId.STAKE }).setSigner(bytes).setFee(1000n)...
 */
export class IrysCommitmentTransactionBuilder {
  private _irysApiUrl: string;
  private _chainId: bigint;
  private _commitmentType?: CommitmentType;
  private _fee?: bigint;
  private _value?: bigint;
  private _signer?: Uint8Array; // 20 bytes
  private _anchor?: Uint8Array; // 32 bytes (set during build, or manually for testing)
  private _pledgeCount = 0;

  constructor(irysApiUrl: string, chainId: bigint) {
    this._irysApiUrl = irysApiUrl;
    this._chainId = chainId;
  }

  /**
   * Set the commitment type. Accepts string ('STAKE' | 'PLEDGE') for the standard API
   * or CommitmentType for low-level use. For PLEDGE string form, use setPledgeCount() before or after.
   */
  setCommitmentType(type: CommitmentType | CommitmentTypeString): this {
    if (type === 'STAKE') {
      this._commitmentType = { type: CommitmentTypeId.STAKE };
    } else if (type === 'PLEDGE') {
      this._commitmentType = { type: CommitmentTypeId.PLEDGE, pledgeCount: BigInt(this._pledgeCount) };
    } else {
      this._commitmentType = type;
    }
    return this;
  }

  /** Set the transaction fee (bigint or string from Irys price API) */
  setFee(fee: bigint | string): this {
    this._fee = typeof fee === 'string' ? BigInt(fee) : fee;
    return this;
  }

  /** Set the transaction value (bigint or string from Irys price API) */
  setValue(value: bigint | string): this {
    this._value = typeof value === 'string' ? BigInt(value) : value;
    return this;
  }

  /** Set the signer address (hex string with or without 0x, or 20-byte Uint8Array) */
  setSigner(signer: Uint8Array | string): this {
    const bytes = typeof signer === 'string' ? hexAddressToBytes(signer) : signer;
    if (bytes.length !== 20) {
      throw new Error(`Signer must be 20 bytes, got ${bytes.length}`);
    }
    this._signer = bytes;
    return this;
  }

  /** Set the chain ID (number or bigint, e.g. 3282 mainnet, 1270 testnet) */
  setChainId(chainId: bigint | number): this {
    this._chainId = typeof chainId === 'number' ? BigInt(chainId) : chainId;
    return this;
  }

  /** Set the pledge count for PLEDGE. Call before or after setCommitmentType('PLEDGE'). */
  setPledgeCount(n: number): this {
    this._pledgeCount = n;
    if (this._commitmentType?.type === CommitmentTypeId.PLEDGE) {
      this._commitmentType = { type: CommitmentTypeId.PLEDGE, pledgeCount: BigInt(n) };
    }
    return this;
  }

  /**
   * Manually set the anchor (for testing). If not set, build() fetches it from the API.
   */
  setAnchor(anchor: Uint8Array): this {
    if (anchor.length !== 32) {
      throw new Error(`Anchor must be 32 bytes, got ${anchor.length}`);
    }
    this._anchor = anchor;
    return this;
  }

  /**
   * Fetch the current anchor (block hash) from the Irys API.
   * This is the nonce equivalent for commitment transactions.
   * Called during build() if anchor hasn't been manually set.
   */
  async fetchAnchor(): Promise<Uint8Array> {
    const response = await request.get(`${this._irysApiUrl}/anchor`).accept('json');

    if (!response.ok) {
      throw new Error(`Failed to fetch anchor: ${response.status} ${response.text}`);
    }

    const anchorInfo: AnchorInfo = response.body;
    return decodeBase58ToFixed(anchorInfo.blockHash, 32);
  }

  /**
   * Encode the commitment type for RLP signing.
   *
   * CRITICAL: STAKE (1) MUST be a flat number, NOT an array.
   * PLEDGE MUST be a nested array. The Irys Rust decoder
   * rejects non-canonical encoding.
   *
   * Reference: irys-js/src/common/commitmentTransaction.ts lines 180-199
   */
  static encodeCommitmentTypeForSigning(
    type: CommitmentType
  ): number | bigint | Uint8Array | (number | bigint | Uint8Array)[] {
    switch (type.type) {
      case CommitmentTypeId.STAKE:
        return CommitmentTypeId.STAKE; // flat number
      case CommitmentTypeId.PLEDGE:
        return [CommitmentTypeId.PLEDGE, type.pledgeCount]; // nested array
      default:
        throw new Error(`Unknown commitment type`);
    }
  }

  /**
   * Encode the commitment type for the JSON broadcast payload.
   */
  static encodeCommitmentTypeForBroadcast(type: CommitmentType): EncodedCommitmentType {
    switch (type.type) {
      case CommitmentTypeId.STAKE:
        return { type: 'stake' };
      case CommitmentTypeId.PLEDGE:
        return { type: 'pledge', pledgeCountBeforeExecuting: type.pledgeCount.toString() };
      default:
        throw new Error(`Unknown commitment type`);
    }
  }

  /**
   * Validate that all required fields are set before building.
   */
  private validateFields(): void {
    if (!this._commitmentType) throw new Error('Commitment type is required');
    if (this._fee === undefined) throw new Error('Fee is required');
    if (this._value === undefined) throw new Error('Value is required');
    if (!this._signer) throw new Error('Signer is required');
  }

  /**
   * Build the unsigned commitment transaction.
   * Returns the standard build result with serializedTxHex, signableHex, fields, and coinSpecific.
   */
  async build(): Promise<CommitmentTransactionBuildResult> {
    this.validateFields();

    if (!this._anchor) {
      this._anchor = await this.fetchAnchor();
    }

    const fields: CommitmentTransactionFields = {
      version: COMMITMENT_TX_VERSION,
      anchor: this._anchor,
      signer: this._signer!,
      commitmentType: this._commitmentType!,
      chainId: this._chainId,
      fee: this._fee!,
      value: this._value!,
    };

    const rlpEncoded = this.rlpEncode(fields);
    const prehash = this.computePrehash(rlpEncoded);

    return {
      serializedTxHex: Buffer.from(rlpEncoded).toString('hex'),
      signableHex: Buffer.from(prehash).toString('hex'),
      fields,
      coinSpecific: { keyServerPathPrefix: 'irys' },
    };
  }

  /**
   * RLP encode the 7 commitment transaction fields.
   *
   * Field order is CRITICAL and must match the Irys protocol exactly:
   * [version, anchor, signer, commitmentType, chainId, fee, value]
   *
   * Reference: irys-js/src/common/commitmentTransaction.ts lines 405-419
   */
  rlpEncode(fields: CommitmentTransactionFields): Uint8Array {
    const rlpFields = [
      fields.version,
      fields.anchor,
      fields.signer,
      IrysCommitmentTransactionBuilder.encodeCommitmentTypeForSigning(fields.commitmentType),
      fields.chainId,
      fields.fee,
      fields.value,
    ];

    return RLP.encode(rlpFields as any);
  }

  /**
   * Compute the prehash: keccak256(rlpEncoded).
   * Returns 32 bytes.
   */
  computePrehash(rlpEncoded: Uint8Array): Uint8Array {
    const hash = keccak256(rlpEncoded);
    return arrayify(hash);
  }

  /**
   * Compute the transaction ID from a signature.
   * txId = base58(keccak256(signature))
   *
   * @param signature - 65-byte raw ECDSA signature (r || s || v)
   */
  static computeTxId(signature: Uint8Array): string {
    if (signature.length !== 65) {
      throw new Error(`Signature must be 65 bytes, got ${signature.length}`);
    }
    const idBytes = arrayify(keccak256(signature));
    return encodeBase58(idBytes);
  }

  /**
   * Create the JSON broadcast payload from a signed transaction.
   *
   * @param fields - The transaction fields used to build the transaction
   * @param signature - 65-byte raw ECDSA signature
   * @returns JSON payload ready for POST /v1/commitment-tx
   */
  static createBroadcastPayload(
    fields: CommitmentTransactionFields,
    signature: Uint8Array
  ): EncodedSignedCommitmentTransaction {
    const txId = IrysCommitmentTransactionBuilder.computeTxId(signature);
    return {
      version: fields.version,
      anchor: encodeBase58(fields.anchor),
      signer: encodeBase58(fields.signer),
      commitmentType: IrysCommitmentTransactionBuilder.encodeCommitmentTypeForBroadcast(fields.commitmentType),
      chainId: fields.chainId.toString(),
      fee: fields.fee.toString(),
      value: fields.value.toString(),
      id: txId,
      signature: encodeBase58(signature),
    };
  }
}
