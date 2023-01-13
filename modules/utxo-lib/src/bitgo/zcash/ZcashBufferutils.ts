/**
 * Transaction (de)serialization helpers.
 * Only supports full transparent transactions
 * Shielded inputs and outputs are supported in that we can (de)serialize
 * the transaction, but we don't fully read them.
 *
 * References:
 * - https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L771
 */
import { TxInput, TxOutput } from 'bitcoinjs-lib';
import { BufferReader, BufferWriter } from 'bitcoinjs-lib/src/bufferutils';

import { UnsupportedTransactionError, ZcashTransaction } from './ZcashTransaction';
import { readOutputDescriptionV5, readSpendDescriptionsV5 } from './ZcashShieldedBufferutils';

export const VALUE_INT64_ZERO = Buffer.from('0000000000000000', 'hex');

export function readInputs(bufferReader: BufferReader): TxInput[] {
  const vinLen = bufferReader.readVarInt();
  const ins: TxInput[] = [];
  for (let i = 0; i < vinLen; ++i) {
    ins.push({
      hash: bufferReader.readSlice(32),
      index: bufferReader.readUInt32(),
      script: bufferReader.readVarSlice(),
      sequence: bufferReader.readUInt32(),
      witness: [],
    });
  }
  return ins;
}

export function readOutputs<TNumber extends number | bigint>(
  bufferReader: BufferReader,
  amountType: 'number' | 'bigint' = 'number'
): TxOutput<TNumber>[] {
  const voutLen = bufferReader.readVarInt();
  const outs: TxOutput<TNumber>[] = [];
  for (let i = 0; i < voutLen; ++i) {
    outs.push({
      value: (amountType === 'bigint' ? bufferReader.readUInt64BigInt() : bufferReader.readUInt64()) as TNumber,
      script: bufferReader.readVarSlice(),
    });
  }
  return outs;
}

export function readEmptyVector(bufferReader: BufferReader): void {
  const n = bufferReader.readVarInt();
  if (n !== 0) {
    throw new UnsupportedTransactionError(`expected empty vector`);
  }
}

export function readEmptyOrchardBundle(bufferReader: BufferReader): void {
  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/orchard.h#L66
  // https://github.com/zcash/librustzcash/blob/edcde252de221d4851f1e5145306c2caf95453bc/zcash_primitives/src/transaction/components/orchard.rs#L36
  const v = bufferReader.readUInt8();
  if (v !== 0x00) {
    throw new UnsupportedTransactionError(`expected byte 0x00`);
  }
}

export function writeEmptyOrchardBundle(bufferWriter: BufferWriter): void {
  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/orchard.h#L66
  // https://github.com/zcash/librustzcash/blob/edcde252de221d4851f1e5145306c2caf95453bc/zcash_primitives/src/transaction/components/orchard.rs#L201
  bufferWriter.writeUInt8(0);
}

export function readSaplingBundle(bufferReader: BufferReader): void {
  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L283
  const vSpendsSapling = readSpendDescriptionsV5(bufferReader); /* vSpendsSapling */
  const vOutputsSapling = readOutputDescriptionV5(bufferReader); /* vOutputsSapling */

  const hasSapling = !(vSpendsSapling.length === 0 && vOutputsSapling.length === 0);
  if (hasSapling) {
    // https://github.com/zcash/zcash/blob/3f09cfa00a3c90336580a127e0096d99e25a38d6/src/amount.h#L15
    bufferReader.readUInt8();
  }

  if (vSpendsSapling.length > 0) {
    bufferReader.readInt32();
  }
}

export function writeSaplingBundle(bufferWriter: BufferWriter): void {
  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L283
  bufferWriter.writeVarInt(0) /* vSpendsSapling */;
  bufferWriter.writeVarInt(0) /* vOutputsSapling */;
}

export function fromBufferV4<TNumber extends number | bigint>(
  bufferReader: BufferReader,
  tx: ZcashTransaction<TNumber>,
  amountType: 'number' | 'bigint' = 'number'
): void {
  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L855-L857
  tx.ins = readInputs(bufferReader);
  tx.outs = readOutputs<TNumber>(bufferReader, amountType);
  tx.locktime = bufferReader.readUInt32();

  if (tx.isOverwinterCompatible()) {
    tx.expiryHeight = bufferReader.readUInt32();
  }

  if (tx.isSaplingCompatible()) {
    const valueBalance = bufferReader.readSlice(8);
    if (!valueBalance.equals(VALUE_INT64_ZERO)) {
      /* istanbul ignore next */
      throw new UnsupportedTransactionError(`valueBalance must be zero`);
    }

    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L863
    readSaplingBundle(bufferReader);
  }

  if (tx.supportsJoinSplits()) {
    // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L869
    readEmptyVector(bufferReader) /* vJoinSplit */;
  }
}

export function fromBufferV5<TNumber extends number | bigint>(
  bufferReader: BufferReader,
  tx: ZcashTransaction<TNumber>,
  amountType: 'number' | 'bigint' = 'number'
): void {
  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L815
  tx.consensusBranchId = bufferReader.readUInt32();
  tx.locktime = bufferReader.readUInt32();
  tx.expiryHeight = bufferReader.readUInt32();

  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L828
  tx.ins = readInputs(bufferReader);
  tx.outs = readOutputs<TNumber>(bufferReader, amountType);

  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L835
  readSaplingBundle(bufferReader);
  readEmptyOrchardBundle(bufferReader);
}

export function writeInputs(bufferWriter: BufferWriter, ins: TxInput[]): void {
  bufferWriter.writeVarInt(ins.length);
  ins.forEach(function (txIn) {
    bufferWriter.writeSlice(txIn.hash);
    bufferWriter.writeUInt32(txIn.index);
    bufferWriter.writeVarSlice(txIn.script);
    bufferWriter.writeUInt32(txIn.sequence);
  });
}

export function writeOutputs<TNumber extends number | bigint>(
  bufferWriter: BufferWriter,
  outs: TxOutput<TNumber>[]
): void {
  bufferWriter.writeVarInt(outs.length);
  outs.forEach(function (txOut) {
    if ((txOut as any).valueBuffer) {
      bufferWriter.writeSlice((txOut as any).valueBuffer);
    } else {
      bufferWriter.writeUInt64(txOut.value);
    }

    bufferWriter.writeVarSlice(txOut.script);
  });
}

export function toBufferV4<TNumber extends number | bigint>(
  bufferWriter: BufferWriter,
  tx: ZcashTransaction<TNumber>
): void {
  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L1083
  writeInputs(bufferWriter, tx.ins);
  writeOutputs<TNumber>(bufferWriter, tx.outs);

  bufferWriter.writeUInt32(tx.locktime);

  if (tx.isOverwinterCompatible()) {
    bufferWriter.writeUInt32(tx.expiryHeight);
  }

  if (tx.isSaplingCompatible()) {
    bufferWriter.writeSlice(VALUE_INT64_ZERO);
    bufferWriter.writeVarInt(0); // vShieldedSpendLength
    bufferWriter.writeVarInt(0); // vShieldedOutputLength
  }

  if (tx.supportsJoinSplits()) {
    bufferWriter.writeVarInt(0); // joinsSplits length
  }
}

export function toBufferV5<TNumber extends number | bigint>(
  bufferWriter: BufferWriter,
  tx: ZcashTransaction<TNumber>
): void {
  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L825-L826
  bufferWriter.writeUInt32(tx.consensusBranchId);
  bufferWriter.writeUInt32(tx.locktime);
  bufferWriter.writeUInt32(tx.expiryHeight);
  writeInputs(bufferWriter, tx.ins);
  writeOutputs<TNumber>(bufferWriter, tx.outs);

  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L1063
  writeSaplingBundle(bufferWriter);
  // https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L1081
  writeEmptyOrchardBundle(bufferWriter);
}
