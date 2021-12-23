import { Transaction, crypto } from 'bitcoinjs-lib';
import * as types from 'bitcoinjs-lib/src/types';
import { BufferReader, BufferWriter } from 'bitcoinjs-lib/src/bufferutils';

const blake2b = require('@bitgo/blake2b');
const varuint = require('varuint-bitcoin');
const typeforce = require('typeforce');

import { networks } from '../../networks';
import { UtxoTransaction, varSliceSize } from '../UtxoTransaction';

const ZERO = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');

const VALUE_INT64_ZERO = Buffer.from('0000000000000000', 'hex');

export type ZcashNetwork = typeof networks.zcash | typeof networks.zcashTest;

/**
 * Blake2b hashing algorithm for Zcash
 * @param buffer
 * @param personalization
 * @returns 256-bit BLAKE2b hash
 */
function getBlake2bHash(buffer: Buffer, personalization: string | Buffer) {
  const out = Buffer.allocUnsafe(32);
  return blake2b(out.length, null, null, Buffer.from(personalization)).update(buffer).digest(out);
}

// https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L29
const SAPLING_VERSION_GROUP_ID = 0x892f2085;

export function getDefaultVersionGroupIdForVersion(version: number): number {
  switch (version) {
    case 4:
      return SAPLING_VERSION_GROUP_ID;
  }
  throw new Error(`not implemented`);
}

export function getDefaultConsensusBranchIdForVersion(version: number): number {
  switch (version) {
    case 1:
    case 2:
      return 0;
    case 3:
      return 0x5ba81b19;
    case 4:
      // 4: 0x76b809bb (old Sapling branch id). Blossom branch id becomes effective after block 653600
      // 4: 0x2bb40e60
      // 4: 0xf5b9230b (Heartwood branch id, see https://zips.z.cash/zip-0250)
      return 0xe9ff75a6; // (Canopy branch id, see https://zips.z.cash/zip-0251)
  }
  throw new Error(`no consensusBranchId for ${version}`);
}

export class ZcashTransaction extends UtxoTransaction {
  static VERSION_JOINSPLITS_SUPPORT = 2;
  static VERSION_OVERWINTER = 3;
  static VERSION_SAPLING = 4;

  // 1 if the transaction is post overwinter upgrade, 0 otherwise
  overwintered = 0;
  // 0x03C48270 (63210096) for overwinter and 0x892F2085 (2301567109) for sapling
  versionGroupId = 0;
  // Block height after which this transactions will expire, or 0 to disable expiry
  expiryHeight = 0;
  consensusBranchId: number;

  constructor(public network: ZcashNetwork, tx?: ZcashTransaction) {
    super(network, tx);

    if (tx) {
      this.overwintered = tx.overwintered;
      this.versionGroupId = tx.versionGroupId;
      this.expiryHeight = tx.expiryHeight;
    }

    this.consensusBranchId = getDefaultConsensusBranchIdForVersion(this.version);
  }

  static fromBuffer(buffer: Buffer, __noStrict: boolean, network?: ZcashNetwork): ZcashTransaction {
    /* istanbul ignore next */
    if (!network) {
      throw new Error(`must provide network`);
    }

    const bufferReader = new BufferReader(buffer);
    const tx = new ZcashTransaction(network);
    tx.version = bufferReader.readInt32();

    // Split the header into fOverwintered and nVersion
    tx.overwintered = tx.version >>> 31; // Must be 1 for version 3 and up
    tx.version = tx.version & 0x07fffffff; // 3 for overwinter
    tx.consensusBranchId = getDefaultConsensusBranchIdForVersion(tx.version);

    if (tx.isOverwinterCompatible()) {
      tx.versionGroupId = bufferReader.readUInt32();
    }

    const vinLen = bufferReader.readVarInt();
    for (let i = 0; i < vinLen; ++i) {
      tx.ins.push({
        hash: bufferReader.readSlice(32),
        index: bufferReader.readUInt32(),
        script: bufferReader.readVarSlice(),
        sequence: bufferReader.readUInt32(),
        witness: [],
      });
    }

    const voutLen = bufferReader.readVarInt();
    for (let i = 0; i < voutLen; ++i) {
      tx.outs.push({
        value: bufferReader.readUInt64(),
        script: bufferReader.readVarSlice(),
      });
    }

    tx.locktime = bufferReader.readUInt32();

    if (tx.isOverwinterCompatible()) {
      tx.expiryHeight = bufferReader.readUInt32();
    }

    if (tx.isSaplingCompatible()) {
      const valueBalance = bufferReader.readSlice(8);
      if (!valueBalance.equals(VALUE_INT64_ZERO)) {
        /* istanbul ignore next */
        throw new Error(`unsupported valueBalance`);
      }

      const nShieldedSpend = bufferReader.readVarInt();
      if (nShieldedSpend !== 0) {
        /* istanbul ignore next */
        throw new Error(`shielded spend not supported`);
      }

      const nShieldedOutput = bufferReader.readVarInt();
      if (nShieldedOutput !== 0) {
        /* istanbul ignore next */
        throw new Error(`shielded output not supported`);
      }
    }

    if (tx.supportsJoinSplits()) {
      const joinSplitsLen = bufferReader.readVarInt();
      if (joinSplitsLen !== 0) {
        /* istanbul ignore next */
        throw new Error(`joinSplits not supported`);
      }
    }

    if (__noStrict) return tx;
    if (bufferReader.offset !== buffer.length) throw new Error('Transaction has unexpected data');

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
    if (this.isSaplingCompatible()) {
      byteLength += 8; // valueBalance
      byteLength += varuint.encodingLength(0); // inputs
      byteLength += varuint.encodingLength(0); // outputs
    }
    if (this.supportsJoinSplits()) {
      byteLength += varuint.encodingLength(0); // joinsplits
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
  hashForSignatureByNetwork(inIndex: number, prevOutScript: Buffer, value: number, hashType: number): Buffer {
    typeforce(types.tuple(types.UInt32, types.Buffer, types.Number), arguments);

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

    bufferWriter.writeVarInt(this.ins.length);

    this.ins.forEach(function (txIn) {
      bufferWriter.writeSlice(txIn.hash);
      bufferWriter.writeUInt32(txIn.index);
      bufferWriter.writeVarSlice(txIn.script);
      bufferWriter.writeUInt32(txIn.sequence);
    });

    bufferWriter.writeVarInt(this.outs.length);
    this.outs.forEach(function (txOut) {
      if ((txOut as any).valueBuffer) {
        bufferWriter.writeSlice((txOut as any).valueBuffer);
      } else {
        bufferWriter.writeUInt64(txOut.value);
      }

      bufferWriter.writeVarSlice(txOut.script);
    });

    bufferWriter.writeUInt32(this.locktime);

    if (this.isOverwinterCompatible()) {
      bufferWriter.writeUInt32(this.expiryHeight);
    }

    if (this.isSaplingCompatible()) {
      bufferWriter.writeSlice(VALUE_INT64_ZERO);
      bufferWriter.writeVarInt(0); // vShieldedSpendLength
      bufferWriter.writeVarInt(0); // vShieldedOutputLength
    }

    if (this.supportsJoinSplits()) {
      bufferWriter.writeVarInt(0); // joinsSplits length
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
    return crypto.hash256(this.toBuffer());
  }

  clone(): ZcashTransaction {
    return new ZcashTransaction(this.network, this);
  }
}
