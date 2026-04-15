/**
 * Kaspa transaction sighash computation.
 *
 * BIP-143-like scheme using Blake2b-256. All integer fields are little-endian.
 *
 * Reference (authoritative implementation):
 * https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/core/src/hashing/sighash.rs
 */
import { blake2b } from 'blakejs';
import { KaspaTransactionData, KaspaUtxoInput, KaspaTransactionOutput } from './iface';

// SigHash type flags
export const SIGHASH_ALL = 0x01;
export const SIGHASH_NONE = 0x02;
export const SIGHASH_SINGLE = 0x04;
export const SIGHASH_ANYONECANPAY = 0x80;

// Script constants
export const OP_CHECKSIG_SCHNORR = 0xab; // Kaspa Schnorr checksig opcode
export const SCRIPT_PUBLIC_KEY_VERSION = 0; // Standard P2PK version

function blake2b256(data: Buffer): Buffer {
  return Buffer.from(blake2b(data, undefined, 32));
}

/**
 * Build P2PK Schnorr scriptPublicKey from a 32-byte x-only public key.
 * Format: DATA_32(0x20) + xOnlyPubKey(32 bytes) + OP_CHECKSIG_SCHNORR(0xAB)
 */
export function buildP2PKScriptPublicKey(xOnlyPubKey: Buffer): Buffer {
  if (xOnlyPubKey.length !== 32) {
    throw new Error(`Expected 32-byte x-only pubkey, got ${xOnlyPubKey.length}`);
  }
  return Buffer.concat([Buffer.from([0x20]), xOnlyPubKey, Buffer.from([OP_CHECKSIG_SCHNORR])]);
}

/**
 * Derive x-only public key from 33-byte compressed public key.
 */
export function compressedToXOnly(compressedPubKey: Buffer): Buffer {
  if (compressedPubKey.length !== 33) {
    throw new Error(`Expected 33-byte compressed pubkey, got ${compressedPubKey.length}`);
  }
  return compressedPubKey.slice(1); // drop the 02/03 prefix byte
}

// --- Intermediate hash helpers ---

function hashPreviousOutputs(inputs: KaspaUtxoInput[]): Buffer {
  const parts = inputs.map((inp) => {
    const buf = Buffer.alloc(36);
    Buffer.from(inp.transactionId, 'hex').copy(buf, 0);
    buf.writeUInt32LE(inp.transactionIndex, 32);
    return buf;
  });
  return blake2b256(Buffer.concat(parts));
}

function hashSequences(inputs: KaspaUtxoInput[]): Buffer {
  const buf = Buffer.alloc(inputs.length * 8);
  inputs.forEach((inp, i) => {
    buf.writeBigUInt64LE(BigInt(inp.sequence || '0'), i * 8);
  });
  return blake2b256(buf);
}

function hashSigOpCounts(inputs: KaspaUtxoInput[]): Buffer {
  const bytes = inputs.map((inp) => inp.sigOpCount ?? 1);
  return blake2b256(Buffer.from(bytes));
}

function serializeOutput(output: KaspaTransactionOutput): Buffer {
  const scriptBytes = Buffer.from(output.scriptPublicKey || '', 'hex');
  const spkVersion = 0; // standard P2PK
  // value (u64 LE, 8) + spk_version (u16 LE, 2) + script_length (u64 LE, 8) + script
  const buf = Buffer.alloc(8 + 2 + 8 + scriptBytes.length);
  let offset = 0;
  buf.writeBigUInt64LE(BigInt(output.amount), offset);
  offset += 8;
  buf.writeUInt16LE(spkVersion, offset);
  offset += 2;
  buf.writeBigUInt64LE(BigInt(scriptBytes.length), offset);
  offset += 8;
  scriptBytes.copy(buf, offset);
  return buf;
}

function hashOutputs(tx: KaspaTransactionData, inputIndex: number, sigHashType: number): Buffer {
  const baseType = sigHashType & 0x1f;
  if (baseType === SIGHASH_NONE) {
    return Buffer.alloc(32); // zero hash
  }
  if (baseType === SIGHASH_SINGLE) {
    if (inputIndex >= tx.outputs.length) {
      return Buffer.alloc(32);
    }
    return blake2b256(serializeOutput(tx.outputs[inputIndex]));
  }
  // SIGHASH_ALL
  const parts = tx.outputs.map(serializeOutput);
  return blake2b256(Buffer.concat(parts));
}

function hashPayload(tx: KaspaTransactionData): Buffer {
  const subnetId = Buffer.from(tx.subnetworkId || '0000000000000000000000000000000000000000', 'hex');
  // If subnetwork is native (all zeros), payloadHash is zero
  if (subnetId.every((b) => b === 0)) {
    return Buffer.alloc(32);
  }
  return blake2b256(Buffer.from(tx.payload || '', 'hex'));
}

/**
 * Compute the Kaspa sighash for a specific input.
 *
 * @param tx        Full transaction data
 * @param inputIndex Index of the input being signed
 * @param sigHashType SigHash type flags (use SIGHASH_ALL = 0x01 for standard)
 */
export function computeKaspaSigningHash(
  tx: KaspaTransactionData,
  inputIndex: number,
  sigHashType: number = SIGHASH_ALL
): Buffer {
  const anyoneCanPay = !!(sigHashType & SIGHASH_ANYONECANPAY);
  const baseType = sigHashType & 0x1f;

  const input = tx.inputs[inputIndex];
  if (!input) {
    throw new Error(`Input index ${inputIndex} out of range`);
  }

  // Conditional intermediate hashes
  const prevOutputsHash = anyoneCanPay ? Buffer.alloc(32) : hashPreviousOutputs(tx.inputs);
  const seqHash =
    anyoneCanPay || baseType === SIGHASH_SINGLE || baseType === SIGHASH_NONE
      ? Buffer.alloc(32)
      : hashSequences(tx.inputs);
  const sigOpHash = anyoneCanPay ? Buffer.alloc(32) : hashSigOpCounts(tx.inputs);
  const outsHash = hashOutputs(tx, inputIndex, sigHashType);
  const payloadHash = hashPayload(tx);

  // Parse the current input's script public key
  const scriptBytes = Buffer.from(input.scriptPublicKey || '', 'hex');
  const spkVersion = 0; // standard P2PK
  const subnetId = Buffer.from(tx.subnetworkId || '0000000000000000000000000000000000000000', 'hex');

  // Build the preimage
  const fixedSize = 2 + 32 + 32 + 32 + 32 + 4 + 2 + 8 + 8 + 8 + 1 + 32 + 8 + 20 + 8 + 32 + 1;
  const preimage = Buffer.alloc(fixedSize + scriptBytes.length);
  let offset = 0;

  // 1. version
  preimage.writeUInt16LE(tx.version ?? 0, offset);
  offset += 2;

  // 2. previousOutputsHash
  prevOutputsHash.copy(preimage, offset);
  offset += 32;

  // 3. sequencesHash
  seqHash.copy(preimage, offset);
  offset += 32;

  // 4. sigOpCountsHash
  sigOpHash.copy(preimage, offset);
  offset += 32;

  // 5. current input's previous outpoint txId
  Buffer.from(input.transactionId, 'hex').copy(preimage, offset);
  offset += 32;

  // 6. current input's previous outpoint index
  preimage.writeUInt32LE(input.transactionIndex, offset);
  offset += 4;

  // 7. scriptPublicKey version
  preimage.writeUInt16LE(spkVersion, offset);
  offset += 2;

  // 8. scriptPublicKey length (u64 LE)
  preimage.writeBigUInt64LE(BigInt(scriptBytes.length), offset);
  offset += 8;

  // 9. scriptPublicKey bytes
  scriptBytes.copy(preimage, offset);
  offset += scriptBytes.length;

  // 10. value (amount in sompi, u64 LE)
  preimage.writeBigUInt64LE(BigInt(input.amount), offset);
  offset += 8;

  // 11. sequence (u64 LE)
  preimage.writeBigUInt64LE(BigInt(input.sequence || '0'), offset);
  offset += 8;

  // 12. sigOpCount (u8)
  preimage.writeUInt8(input.sigOpCount ?? 1, offset);
  offset += 1;

  // 13. outputsHash
  outsHash.copy(preimage, offset);
  offset += 32;

  // 14. locktime (u64 LE)
  preimage.writeBigUInt64LE(BigInt(tx.lockTime || '0'), offset);
  offset += 8;

  // 15. subnetworkId (20 bytes)
  subnetId.copy(preimage, offset);
  offset += 20;

  // 16. gas (u64 LE) — always 0 for native KASPA
  preimage.writeBigUInt64LE(0n, offset);
  offset += 8;

  // 17. payloadHash
  payloadHash.copy(preimage, offset);
  offset += 32;

  // 18. sigHashType (u8)
  preimage.writeUInt8(sigHashType, offset);
  offset += 1;

  return blake2b256(preimage.slice(0, offset));
}
