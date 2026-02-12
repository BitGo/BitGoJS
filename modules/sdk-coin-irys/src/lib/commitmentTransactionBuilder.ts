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
import { encodeBase58, decodeBase58ToFixed } from './utils';

/**
 * Builder for Irys commitment transactions (STAKE, PLEDGE).
 *
 * Commitment transactions are NOT standard EVM transactions. They use a custom
 * 7-field RLP encoding with keccak256 prehash and raw ECDSA signing.
 *
 * Usage (STAKE):
 *   const builder = new IrysCommitmentTransactionBuilder(apiUrl, chainId);
 *   builder.setCommitmentType({ type: CommitmentTypeId.STAKE });
 *   builder.setFee(fee);
 *   builder.setValue(value);
 *   builder.setSigner(signerAddress);
 *   const result = await builder.build(); // fetches anchor, RLP encodes, returns prehash
 *
 * Usage (PLEDGE):
 *   builder.setCommitmentType({ type: CommitmentTypeId.PLEDGE, pledgeCount: 0n });
 */
export class IrysCommitmentTransactionBuilder {
  private _irysApiUrl: string;
  private _chainId: bigint;
  private _commitmentType?: CommitmentType;
  private _fee?: bigint;
  private _value?: bigint;
  private _signer?: Uint8Array; // 20 bytes
  private _anchor?: Uint8Array; // 32 bytes (set during build, or manually for testing)

  constructor(irysApiUrl: string, chainId: bigint) {
    this._irysApiUrl = irysApiUrl;
    this._chainId = chainId;
  }

  /**
   * Set the commitment type for this transaction.
   * STAKE is a single-operation type.
   * PLEDGE requires pledgeCount.
   */
  setCommitmentType(type: CommitmentType): this {
    this._commitmentType = type;
    return this;
  }

  /** Set the transaction fee (from Irys price API) */
  setFee(fee: bigint): this {
    this._fee = fee;
    return this;
  }

  /** Set the transaction value (from Irys price API) */
  setValue(value: bigint): this {
    this._value = value;
    return this;
  }

  /** Set the signer address (20-byte Ethereum address as Uint8Array) */
  setSigner(signer: Uint8Array): this {
    if (signer.length !== 20) {
      throw new Error(`Signer must be 20 bytes, got ${signer.length}`);
    }
    this._signer = signer;
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
   *
   * 1. Validates all fields are set
   * 2. Fetches anchor from Irys API (if not manually set) -- done LAST to minimize expiration
   * 3. RLP encodes the 7 fields in exact order
   * 4. Computes keccak256 prehash
   * 5. Returns prehash (for HSM) and rlpEncoded (for HSM validation)
   */
  async build(): Promise<CommitmentTransactionBuildResult> {
    this.validateFields();

    // Fetch anchor LAST -- it expires in ~45 blocks (~9 min)
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

    return { prehash, rlpEncoded, fields };
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
