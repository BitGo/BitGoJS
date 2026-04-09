/**
 * Implements hashing methods described in https://zips.z.cash/zip-0244.
 * Only supports full transparent transactions without shielded inputs or outputs.
 */
import { Transaction, TxInput, TxOutput } from 'bitcoinjs-lib';
import { BufferWriter } from 'bitcoinjs-lib/src/bufferutils';

const blake2b = require('@bitgo/blake2b');

import { ZcashTransaction } from './ZcashTransaction';
import { varSliceSize } from '../UtxoTransaction';

type SignatureParams<TNumber extends number | bigint = number> = {
  inIndex?: number;
  prevOutScript: Buffer;
  value: TNumber;
  hashType: number;
};

/**
 * Blake2b hashing algorithm for Zcash
 * @param buffer
 * @param personalization
 * @returns 256-bit BLAKE2b hash
 */
export function getBlake2bHash(buffer: Buffer, personalization: string | Buffer): Buffer {
  const out = Buffer.allocUnsafe(32);
  personalization = Buffer.from(personalization);
  return blake2b(out.length, null, null, personalization).update(buffer).digest(out);
}

function getHeaderDigest<TNumber extends number | bigint>(tx: ZcashTransaction<TNumber>): Buffer {
  // https://zips.z.cash/zip-0244#t-1-header-digest
  const mask = tx.overwintered ? 1 : 0;
  const writer = BufferWriter.withCapacity(4 * 5);
  writer.writeInt32(tx.version | (mask << 31)); // Set overwinter bit
  writer.writeUInt32(tx.versionGroupId);
  writer.writeUInt32(tx.consensusBranchId);
  writer.writeUInt32(tx.locktime);
  writer.writeUInt32(tx.expiryHeight);
  return getBlake2bHash(writer.end(), 'ZTxIdHeadersHash');
}

export function getPrevoutsDigest<TNumber extends number | bigint>(
  ins: TxInput[],
  tag = 'ZTxIdPrevoutHash',
  sigParams?: SignatureParams<TNumber>
): Buffer {
  if (sigParams) {
    if (sigParams.hashType & Transaction.SIGHASH_ANYONECANPAY) {
      return getPrevoutsDigest([]);
    }
  }

  const bufferWriter = new BufferWriter(Buffer.allocUnsafe(36 * ins.length));
  ins.forEach(function (txIn) {
    bufferWriter.writeSlice(txIn.hash);
    bufferWriter.writeUInt32(txIn.index);
  });
  return getBlake2bHash(bufferWriter.end(), tag);
}

export function getSequenceDigest<TNumber extends number | bigint>(
  ins: TxInput[],
  tag = 'ZTxIdSequencHash',
  sigParams?: SignatureParams<TNumber>
): Buffer {
  // txid: https://zips.z.cash/zip-0244#t-2b-sequence-digest
  // sig: https://zips.z.cash/zip-0244#s-2b-sequence-sig-digest
  // https://github.com/zcash-hackworks/zcash-test-vectors/blob/dd8fdb/zip_0244.py#L263
  if (sigParams) {
    const { hashType } = sigParams;
    if (
      hashType & Transaction.SIGHASH_ANYONECANPAY ||
      (hashType & 0x1f) === Transaction.SIGHASH_SINGLE ||
      (hashType & 0x1f) === Transaction.SIGHASH_NONE
    ) {
      return getSequenceDigest([]);
    }
  }

  const bufferWriter = new BufferWriter(Buffer.allocUnsafe(4 * ins.length));

  ins.forEach(function (txIn) {
    bufferWriter.writeUInt32(txIn.sequence);
  });

  return getBlake2bHash(bufferWriter.end(), tag);
}

export function getOutputsDigest<TNumber extends number | bigint>(
  outs: TxOutput<TNumber>[],
  tag = 'ZTxIdOutputsHash',
  sigParams?: SignatureParams<TNumber>
): Buffer {
  // txid: https://zips.z.cash/zip-0244#t-2c-outputs-digest
  // sig: https://zips.z.cash/zip-0244#s-2c-outputs-sig-digest
  // https://github.com/zcash-hackworks/zcash-test-vectors/blob/dd8fdb/zip_0244.py#L275
  if (sigParams) {
    let { hashType } = sigParams;
    hashType = hashType & 0x1f;

    if (hashType === Transaction.SIGHASH_SINGLE) {
      if (sigParams.inIndex === undefined) {
        throw new Error();
      }
      if (outs[sigParams.inIndex] === undefined) {
        return getOutputsDigest(outs);
      }
      return getOutputsDigest([outs[sigParams.inIndex]]);
    }

    if (hashType === Transaction.SIGHASH_NONE) {
      return getOutputsDigest([]);
    }

    return getOutputsDigest(outs, tag);
  }

  // Find out the size of the outputs and write them
  const txOutsSize = outs.reduce(function (sum, output) {
    return sum + 8 + varSliceSize(output.script);
  }, 0);

  const bufferWriter = new BufferWriter(Buffer.allocUnsafe(txOutsSize));

  outs.forEach(function (out) {
    bufferWriter.writeUInt64(out.value);
    bufferWriter.writeVarSlice(out.script);
  });

  return getBlake2bHash(bufferWriter.end(), tag);
}

function getTxinDigest<TNumber extends number | bigint>(input: TxInput, sigParams: SignatureParams<TNumber>) {
  // https://zips.z.cash/zip-0244#s-2d-txin-sig-digest
  // https://github.com/zcash-hackworks/zcash-test-vectors/blob/dd8fdb/zip_0244.py#L291
  const writer = BufferWriter.withCapacity(
    32 /* prevout hash */ +
      4 /* prevout vin */ +
      varSliceSize(sigParams.prevOutScript) +
      8 /* value */ +
      4 /* sequence */
  );
  writer.writeSlice(input.hash);
  writer.writeUInt32(input.index);
  writer.writeVarSlice(sigParams.prevOutScript);
  writer.writeUInt64(sigParams.value);
  writer.writeUInt32(input.sequence);
  return getBlake2bHash(writer.end(), 'Zcash___TxInHash');
}

function getTransparentDigest<TNumber extends number | bigint>(
  tx: { ins: TxInput[]; outs: TxOutput<TNumber>[] },
  sigParams?: SignatureParams<TNumber>
): Buffer {
  // txid: https://zips.z.cash/zip-0244#t-2-transparent-digest
  // sig: https://zips.z.cash/zip-0244#s-2a-prevouts-sig-digest
  if (sigParams) {
    if (sigParams.inIndex === undefined) {
      return getTransparentDigest(tx);
    }
  }

  let buffer;
  if (tx.ins.length || tx.outs.length) {
    const writer = BufferWriter.withCapacity(32 * (sigParams ? 4 : 3));
    writer.writeSlice(getPrevoutsDigest(tx.ins, undefined, sigParams));
    writer.writeSlice(getSequenceDigest(tx.ins, undefined, sigParams));
    writer.writeSlice(getOutputsDigest(tx.outs, undefined, sigParams));
    if (sigParams) {
      if (sigParams.inIndex === undefined) {
        throw new Error();
      }
      writer.writeSlice(getTxinDigest(tx.ins[sigParams.inIndex], sigParams));
    }
    buffer = writer.end();
  } else {
    buffer = Buffer.of();
  }
  return getBlake2bHash(buffer, 'ZTxIdTranspaHash');
}

function getSaplingDigest<TNumber extends number | bigint>(tx: ZcashTransaction<TNumber>): Buffer {
  // https://zips.z.cash/zip-0244#t-3-sapling-digest
  return getBlake2bHash(Buffer.of(), 'ZTxIdSaplingHash');
}

function getOrchardDigest<TNumber extends number | bigint>(tx: ZcashTransaction<TNumber>): Buffer {
  // https://zips.z.cash/zip-0244#t-4-orchard-digest
  return getBlake2bHash(Buffer.of(), 'ZTxIdOrchardHash');
}

/**
 * @param tx
 * @param signatureParams - calculates txid when undefined
 */
function getDigest<TNumber extends number | bigint>(
  tx: ZcashTransaction<TNumber>,
  signatureParams?: SignatureParams<TNumber>
): Buffer {
  // txid: https://zips.z.cash/zip-0244#id4
  // sig: https://zips.z.cash/zip-0244#id13
  const writer = BufferWriter.withCapacity(32 * 4);
  writer.writeSlice(getHeaderDigest(tx));
  writer.writeSlice(getTransparentDigest(tx, signatureParams));
  writer.writeSlice(getSaplingDigest(tx));
  writer.writeSlice(getOrchardDigest(tx));

  const tag = 'ZcashTxHash_';
  const personalization = BufferWriter.withCapacity(tag.length + 4 /* UInt32 */);
  personalization.writeSlice(Buffer.from(tag));
  personalization.writeUInt32(tx.consensusBranchId);
  return getBlake2bHash(writer.end(), personalization.end());
}

export function getTxidDigest<TNumber extends number | bigint>(tx: ZcashTransaction<TNumber>): Buffer {
  // https://zips.z.cash/zip-0244#id4
  return getDigest(tx);
}

export function getSignatureDigest<TNumber extends number | bigint>(
  tx: ZcashTransaction<TNumber>,
  inIndex: number | undefined,
  prevOutScript: Buffer,
  value: TNumber,
  hashType: number
): Buffer {
  // https://zips.z.cash/zip-0244#id13
  return getDigest(tx, {
    inIndex,
    prevOutScript,
    value,
    hashType,
  });
}
