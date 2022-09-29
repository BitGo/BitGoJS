import { Transaction, crypto } from 'bitcoinjs-lib';
import * as types from 'bitcoinjs-lib/src/types';
import { BufferReader, BufferWriter } from 'bitcoinjs-lib/src/bufferutils';

const varuint = require('varuint-bitcoin');
const typeforce = require('typeforce');

import { networks } from '../../networks';
import { UtxoTransaction, varSliceSize } from '../UtxoTransaction';
import { fromBufferV4, fromBufferV5, toBufferV4, toBufferV5, VALUE_INT64_ZERO } from './ZcashBufferutils';
import { getBlake2bHash, getSignatureDigest, getTxidDigest } from './hashZip0244';

const ZERO = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');

export type ZcashNetwork = typeof networks.zcash | typeof networks.zcashTest;

// https://github.com/zcash/zcash/blob/v4.7.0/src/primitives/transaction.h#L40
const SAPLING_VERSION_GROUP_ID = 0x892f2085;
// https://github.com/zcash/zcash/blob/v4.7.0/src/primitives/transaction.h#L52
const ZIP225_VERSION_GROUP_ID = 0x26a7270a;

// https://github.com/zcash/zcash/blob/v4.7.0/src/consensus/upgrades.cpp#L11
const OVERWINTER_BRANCH_ID = 0x5ba81b19;
const CANOPY_BRANCH_ID = 0xe9ff75a6;
const NU5_BRANCH_ID = 0xc2d6d0b4;

export class UnsupportedTransactionError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function getDefaultVersionGroupIdForVersion(version: number): number {
  switch (version) {
    case 400:
    case 450:
      return SAPLING_VERSION_GROUP_ID;
    case 500:
      return ZIP225_VERSION_GROUP_ID;
  }
  throw new Error(`no value for version ${version}`);
}

export function getDefaultConsensusBranchIdForVersion(network: ZcashNetwork, version: number): number {
  switch (version) {
    case 1:
    case 2:
      return 0;
    case 3:
      return OVERWINTER_BRANCH_ID;
    case ZcashTransaction.VERSION4_BRANCH_CANOPY:
      // https://zips.z.cash/zip-0251
      return CANOPY_BRANCH_ID;
    case 4:
    case 5:
    case ZcashTransaction.VERSION4_BRANCH_NU5:
    case ZcashTransaction.VERSION5_BRANCH_NU5:
      // https://zips.z.cash/zip-0252
      return NU5_BRANCH_ID;
  }
  throw new Error(`no value for version ${version}`);
}

export class ZcashTransaction<TNumber extends number | bigint = number> extends UtxoTransaction<TNumber> {
  static VERSION_JOINSPLITS_SUPPORT = 2;
  static VERSION_OVERWINTER = 3;
  static VERSION_SAPLING = 4;

  static VERSION4_BRANCH_CANOPY = 400;
  static VERSION4_BRANCH_NU5 = 450;
  static VERSION5_BRANCH_NU5 = 500;

  // 1 if the transaction is post overwinter upgrade, 0 otherwise
  overwintered = 0;
  // 0x03C48270 (63210096) for overwinter and 0x892F2085 (2301567109) for sapling
  versionGroupId = 0;
  // Block height after which this transactions will expire, or 0 to disable expiry
  expiryHeight = 0;
  consensusBranchId: number;

  constructor(public network: ZcashNetwork, tx?: ZcashTransaction<bigint | number>, amountType?: 'bigint' | 'number') {
    super(network, tx, amountType);

    let consensusBranchId;
    if (tx) {
      this.overwintered = tx.overwintered;
      this.versionGroupId = tx.versionGroupId;
      this.expiryHeight = tx.expiryHeight;

      if (tx.consensusBranchId !== undefined) {
        consensusBranchId = tx.consensusBranchId;
      }
    }
    this.consensusBranchId = consensusBranchId ?? getDefaultConsensusBranchIdForVersion(network, this.version);
  }

  static fromBuffer<TNumber extends number | bigint = number>(
    buffer: Buffer,
    __noStrict: boolean,
    amountType: 'number' | 'bigint' = 'number',
    network?: ZcashNetwork
  ): ZcashTransaction<TNumber> {
    /* istanbul ignore next */
    if (!network) {
      throw new Error(`must provide network`);
    }

    const bufferReader = new BufferReader(buffer);
    const tx = new ZcashTransaction<TNumber>(network);
    tx.version = bufferReader.readInt32();

    // Split the header into fOverwintered and nVersion
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L772
    tx.overwintered = tx.version >>> 31; // Must be 1 for version 3 and up
    tx.version = tx.version & 0x07fffffff; // 3 for overwinter
    tx.consensusBranchId = getDefaultConsensusBranchIdForVersion(network, tx.version);

    if (tx.isOverwinterCompatible()) {
      tx.versionGroupId = bufferReader.readUInt32();
    }

    if (tx.version === 5) {
      fromBufferV5(bufferReader, tx, amountType);
    } else {
      fromBufferV4(bufferReader, tx, amountType);
    }

    if (__noStrict) return tx;
    if (bufferReader.offset !== buffer.length) {
      const trailing = buffer.slice(bufferReader.offset);
      throw new Error(`Unexpected trailing bytes: ${trailing.toString('hex')}`);
    }

    return tx;
  }

  static fromBufferWithVersion<TNumber extends number | bigint>(
    buf: Buffer,
    network: ZcashNetwork,
    version?: number,
    amountType: 'number' | 'bigint' = 'number'
  ): ZcashTransaction<TNumber> {
    const tx = ZcashTransaction.fromBuffer<TNumber>(buf, false, amountType, network);
    if (version) {
      tx.consensusBranchId = getDefaultConsensusBranchIdForVersion(network, version);
    }
    return tx;
  }

  byteLength(): number {
    let byteLength = super.byteLength();
    if (this.isOverwinterCompatible()) {
      byteLength += 4; // nVersionGroupId
    }
    if (this.isOverwinterCompatible()) {
      byteLength += 4; // nExpiryHeight
    }
    const emptyVectorLength = varuint.encodingLength(0);
    if (this.version === 5) {
      // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L822
      byteLength += 4; // consensusBranchId
      byteLength += emptyVectorLength; // saplingBundle inputs
      byteLength += emptyVectorLength; // saplingBundle outputs
      byteLength += 1; // orchardBundle (empty)
    } else {
      if (this.isSaplingCompatible()) {
        // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L862
        byteLength += 8; // valueBalance (uint64)
        byteLength += emptyVectorLength; // inputs
        byteLength += emptyVectorLength; // outputs
      }
      if (this.supportsJoinSplits()) {
        //
        byteLength += emptyVectorLength; // joinsplits
      }
    }
    return byteLength;
  }

  isSaplingCompatible(): boolean {
    return !!this.overwintered && this.version >= ZcashTransaction.VERSION_SAPLING;
  }

  isOverwinterCompatible(): boolean {
    return !!this.overwintered && this.version >= ZcashTransaction.VERSION_OVERWINTER;
  }

  supportsJoinSplits(): boolean {
    return !!this.overwintered && this.version >= ZcashTransaction.VERSION_JOINSPLITS_SUPPORT;
  }

  /**
   * Build a hash for all or none of the transaction inputs depending on the hashtype
   * @param hashType
   * @returns Buffer - BLAKE2b hash or 256-bit zero if doesn't apply
   */
  getPrevoutHash(hashType: number): Buffer {
    if (!(hashType & Transaction.SIGHASH_ANYONECANPAY)) {
      const bufferWriter = new BufferWriter(Buffer.allocUnsafe(36 * this.ins.length));

      this.ins.forEach(function (txIn) {
        bufferWriter.writeSlice(txIn.hash);
        bufferWriter.writeUInt32(txIn.index);
      });

      return getBlake2bHash(bufferWriter.buffer, 'ZcashPrevoutHash');
    }
    return ZERO;
  }

  /**
   * Build a hash for all or none of the transactions inputs sequence numbers depending on the hashtype
   * @param hashType
   * @returns Buffer BLAKE2b hash or 256-bit zero if doesn't apply
   */
  getSequenceHash(hashType: number): Buffer {
    if (
      !(hashType & Transaction.SIGHASH_ANYONECANPAY) &&
      (hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
      (hashType & 0x1f) !== Transaction.SIGHASH_NONE
    ) {
      const bufferWriter = new BufferWriter(Buffer.allocUnsafe(4 * this.ins.length));

      this.ins.forEach(function (txIn) {
        bufferWriter.writeUInt32(txIn.sequence);
      });

      return getBlake2bHash(bufferWriter.buffer, 'ZcashSequencHash');
    }
    return ZERO;
  }

  /**
   * Build a hash for one, all or none of the transaction outputs depending on the hashtype
   * @param hashType
   * @param inIndex
   * @returns Buffer BLAKE2b hash or 256-bit zero if doesn't apply
   */
  getOutputsHash(hashType: number, inIndex: number): Buffer {
    if ((hashType & 0x1f) !== Transaction.SIGHASH_SINGLE && (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
      // Find out the size of the outputs and write them
      const txOutsSize = this.outs.reduce(function (sum, output) {
        return sum + 8 + varSliceSize(output.script);
      }, 0);

      const bufferWriter = new BufferWriter(Buffer.allocUnsafe(txOutsSize));

      this.outs.forEach(function (out) {
        bufferWriter.writeUInt64(out.value);
        bufferWriter.writeVarSlice(out.script);
      });

      return getBlake2bHash(bufferWriter.buffer, 'ZcashOutputsHash');
    } else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE && inIndex < this.outs.length) {
      // Write only the output specified in inIndex
      const output = this.outs[inIndex];

      const bufferWriter = new BufferWriter(Buffer.allocUnsafe(8 + varSliceSize(output.script)));
      bufferWriter.writeUInt64(output.value);
      bufferWriter.writeVarSlice(output.script);

      return getBlake2bHash(bufferWriter.buffer, 'ZcashOutputsHash');
    }
    return ZERO;
  }

  /**
   * Hash transaction for signing a transparent transaction in Zcash. Protected transactions are not supported.
   * @param inIndex
   * @param prevOutScript
   * @param value
   * @param hashType
   * @returns Buffer BLAKE2b hash
   */
  hashForSignatureByNetwork(
    inIndex: number | undefined,
    prevOutScript: Buffer,
    value: bigint | number | undefined,
    hashType: number
  ): Buffer {
    if (value === undefined) {
      throw new Error(`must provide value`);
    }

    // https://github.com/zcash/zcash/blob/v4.5.1/src/script/interpreter.cpp#L1175
    if (this.version === 5) {
      return getSignatureDigest(this, inIndex, prevOutScript, value, hashType);
    }

    // ZCash amounts are always within Number.MAX_SAFE_INTEGER
    value = typeof value === 'bigint' ? Number(value) : value;
    typeforce(types.tuple(types.UInt32, types.Buffer, types.Number), [inIndex, prevOutScript, value]);

    if (inIndex === undefined) {
      throw new Error(`invalid inIndex`);
    }

    /* istanbul ignore next */
    if (inIndex >= this.ins.length) {
      throw new Error('Input index is out of range');
    }

    /* istanbul ignore next */
    if (!this.isOverwinterCompatible()) {
      throw new Error(`unsupported version ${this.version}`);
    }

    const hashPrevouts = this.getPrevoutHash(hashType);
    const hashSequence = this.getSequenceHash(hashType);
    const hashOutputs = this.getOutputsHash(hashType, inIndex);
    const hashJoinSplits = ZERO;
    const hashShieldedSpends = ZERO;
    const hashShieldedOutputs = ZERO;

    let baseBufferSize = 0;
    baseBufferSize += 4 * 5; // header, nVersionGroupId, lock_time, nExpiryHeight, hashType
    baseBufferSize += 32 * 4; // 256 hashes: hashPrevouts, hashSequence, hashOutputs, hashJoinSplits
    baseBufferSize += 4 * 2; // input.index, input.sequence
    baseBufferSize += 8; // value
    baseBufferSize += 32; // input.hash
    baseBufferSize += varSliceSize(prevOutScript); // prevOutScript
    if (this.isSaplingCompatible()) {
      baseBufferSize += 32 * 2; // hashShieldedSpends and hashShieldedOutputs
      baseBufferSize += 8; // valueBalance
    }

    const mask = this.overwintered ? 1 : 0;
    const header = this.version | (mask << 31);

    const bufferWriter = new BufferWriter(Buffer.alloc(baseBufferSize));
    bufferWriter.writeInt32(header);
    bufferWriter.writeUInt32(this.versionGroupId);
    bufferWriter.writeSlice(hashPrevouts);
    bufferWriter.writeSlice(hashSequence);
    bufferWriter.writeSlice(hashOutputs);
    bufferWriter.writeSlice(hashJoinSplits);
    if (this.isSaplingCompatible()) {
      bufferWriter.writeSlice(hashShieldedSpends);
      bufferWriter.writeSlice(hashShieldedOutputs);
    }
    bufferWriter.writeUInt32(this.locktime);
    bufferWriter.writeUInt32(this.expiryHeight);
    if (this.isSaplingCompatible()) {
      bufferWriter.writeSlice(VALUE_INT64_ZERO);
    }
    bufferWriter.writeInt32(hashType);

    // The input being signed (replacing the scriptSig with scriptCode + amount)
    // The prevout may already be contained in hashPrevout, and the nSequence
    // may already be contained in hashSequence.
    const input = this.ins[inIndex];
    bufferWriter.writeSlice(input.hash);
    bufferWriter.writeUInt32(input.index);
    bufferWriter.writeVarSlice(prevOutScript);
    bufferWriter.writeUInt64(value);
    bufferWriter.writeUInt32(input.sequence);

    const personalization = Buffer.alloc(16);
    const prefix = 'ZcashSigHash';
    personalization.write(prefix);
    personalization.writeUInt32LE(this.consensusBranchId, prefix.length);

    return getBlake2bHash(bufferWriter.buffer, personalization);
  }

  toBuffer(buffer?: Buffer, initialOffset = 0): Buffer {
    if (!buffer) buffer = Buffer.allocUnsafe(this.byteLength());

    const bufferWriter = new BufferWriter(buffer, initialOffset);

    if (this.isOverwinterCompatible()) {
      const mask = this.overwintered ? 1 : 0;
      bufferWriter.writeInt32(this.version | (mask << 31)); // Set overwinter bit
      bufferWriter.writeUInt32(this.versionGroupId);
    } else {
      bufferWriter.writeInt32(this.version);
    }

    if (this.version === 5) {
      toBufferV5(bufferWriter, this);
    } else {
      toBufferV4(bufferWriter, this);
    }

    if (initialOffset !== undefined) {
      return buffer.slice(initialOffset, bufferWriter.offset);
    }
    return buffer;
  }

  getHash(forWitness?: boolean): Buffer {
    if (forWitness) {
      throw new Error(`invalid argument`);
    }
    if (this.version === 5) {
      return getTxidDigest(this);
    }
    return crypto.hash256(this.toBuffer());
  }

  clone<TN2 extends number | bigint = TNumber>(amountType?: 'bigint' | 'number'): ZcashTransaction<TN2> {
    return new ZcashTransaction<TN2>(this.network, this, amountType);
  }
}
