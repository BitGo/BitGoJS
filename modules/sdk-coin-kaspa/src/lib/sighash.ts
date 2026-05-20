/**
 * Kaspa transaction sighash computation.
 *
 * BIP-143-like scheme using keyed Blake2b-256. All integer fields are
 * little-endian.
 *
 * ALL hashes (intermediate and final) use the same keyed Blake2b-256 hasher:
 *   blake2b_256(data, key="TransactionSigningHash")
 *
 * Reference (authoritative implementation):
 * https://github.com/kaspanet/rusty-kaspa/blob/master/crypto/hashes/src/hashers.rs
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

/**
 * The Blake2b key used for ALL sighash operations in Kaspa.
 * Defined in rusty-kaspa crypto/hashes/src/hashers.rs:
 *   blake2b_hasher! { struct TransactionSigningHash => b"TransactionSigningHash", ... }
 * which resolves to:
 *   blake2b_simd::Params::new().hash_length(32).key(b"TransactionSigningHash").to_state()
 */
const SIGNING_HASH_KEY = Buffer.from('TransactionSigningHash', 'ascii');

/**
 * Keyed Blake2b-256: blake2b(data, key="TransactionSigningHash", outlen=32).
 * Used for every intermediate hash and the final sighash.
 */
function kblake2b(data: Buffer): Buffer {
  return Buffer.from(blake2b(data, SIGNING_HASH_KEY, 32));
}

// ─── Intermediate hash helpers ────────────────────────────────────────────────

function hashPreviousOutputs(inputs: KaspaUtxoInput[]): Buffer {
  const parts = inputs.map((inp) => {
    const buf = Buffer.alloc(36);
    Buffer.from(inp.transactionId, 'hex').copy(buf, 0);
    buf.writeUInt32LE(inp.transactionIndex, 32);
    return buf;
  });
  return kblake2b(Buffer.concat(parts));
}

function hashSequences(inputs: KaspaUtxoInput[]): Buffer {
  const buf = Buffer.alloc(inputs.length * 8);
  inputs.forEach((inp, i) => {
    buf.writeBigUInt64LE(BigInt(inp.sequence || '0'), i * 8);
  });
  return kblake2b(buf);
}

function hashSigOpCounts(inputs: KaspaUtxoInput[]): Buffer {
  const bytes = inputs.map((inp) => inp.sigOpCount ?? 1);
  return kblake2b(Buffer.from(bytes));
}

/**
 * Serialize one output for hashing.
 * Matches hash_output() + hash_script_public_key() in rusty-kaspa:
 *   write_u64(value) + write_u16(spk.version) + write_var_bytes(spk.script)
 * where write_var_bytes = write_u64(len) + write(bytes).
 */
function serializeOutput(output: KaspaTransactionOutput): Buffer {
  const scriptBytes = Buffer.from(output.scriptPublicKey || '', 'hex');
  const spkVersion = 0;
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
    return Buffer.alloc(32);
  }
  if (baseType === SIGHASH_SINGLE) {
    if (inputIndex >= tx.outputs.length) {
      return Buffer.alloc(32);
    }
    return kblake2b(serializeOutput(tx.outputs[inputIndex]));
  }
  // SIGHASH_ALL
  return kblake2b(Buffer.concat(tx.outputs.map(serializeOutput)));
}

function hashPayload(tx: KaspaTransactionData): Buffer {
  const subnetId = Buffer.from(tx.subnetworkId || '0000000000000000000000000000000000000000', 'hex');
  // Native subnetwork (all zeros) with empty payload → zero hash
  if (subnetId.every((b) => b === 0)) {
    return Buffer.alloc(32);
  }
  // write_var_bytes(payload): u64 length prefix + payload bytes
  const payloadBytes = Buffer.from(tx.payload || '', 'hex');
  const lenBuf = Buffer.alloc(8);
  lenBuf.writeBigUInt64LE(BigInt(payloadBytes.length));
  return kblake2b(Buffer.concat([lenBuf, payloadBytes]));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build P2PK Schnorr scriptPublicKey from a 32-byte x-only public key.
 * Format: OP_DATA_32(0x20) + xOnlyPubKey(32 bytes) + OP_CHECKSIG_SCHNORR(0xAB)
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
  return compressedPubKey.slice(1);
}

/**
 * Compute the Kaspa Schnorr sighash for a specific input.
 *
 * Matches calc_schnorr_signature_hash() in rusty-kaspa sighash.rs exactly.
 * All intermediate and the final hash use keyed Blake2b-256 with
 * key = "TransactionSigningHash".
 *
 * @param tx         Full transaction data — inputs must carry amount + scriptPublicKey
 * @param inputIndex 0-based index of the input being signed
 * @param sigHashType SigHash type flags (SIGHASH_ALL = 0x01 for standard)
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

  // Intermediate hashes
  const prevOutputsHash = anyoneCanPay ? Buffer.alloc(32) : hashPreviousOutputs(tx.inputs);
  const seqHash =
    anyoneCanPay || baseType === SIGHASH_SINGLE || baseType === SIGHASH_NONE
      ? Buffer.alloc(32)
      : hashSequences(tx.inputs);
  const sigOpHash = anyoneCanPay ? Buffer.alloc(32) : hashSigOpCounts(tx.inputs);
  const outsHash = hashOutputs(tx, inputIndex, sigHashType);
  const payloadHash = hashPayload(tx);

  // Current input's scriptPublicKey (from the UTXO being spent)
  const scriptBytes = Buffer.from(input.scriptPublicKey || '', 'hex');
  const spkVersion = 0;
  const subnetId = Buffer.from(tx.subnetworkId || '0000000000000000000000000000000000000000', 'hex');

  // Build the preimage — field order matches calc_schnorr_signature_hash() exactly
  const fixedSize = 2 + 32 + 32 + 32 + 32 + 4 + 2 + 8 + 8 + 8 + 1 + 32 + 8 + 20 + 8 + 32 + 1;
  const preimage = Buffer.alloc(fixedSize + scriptBytes.length);
  let offset = 0;

  // 1. tx.version (u16 LE)
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
  // 5. input.previousOutpoint.transactionId (32 bytes)
  Buffer.from(input.transactionId, 'hex').copy(preimage, offset);
  offset += 32;
  // 6. input.previousOutpoint.index (u32 LE)
  preimage.writeUInt32LE(input.transactionIndex, offset);
  offset += 4;
  // 7. scriptPublicKey.version (u16 LE)
  preimage.writeUInt16LE(spkVersion, offset);
  offset += 2;
  // 8. scriptPublicKey.script length (u64 LE) — write_var_bytes length prefix
  preimage.writeBigUInt64LE(BigInt(scriptBytes.length), offset);
  offset += 8;
  // 9. scriptPublicKey.script bytes
  scriptBytes.copy(preimage, offset);
  offset += scriptBytes.length;
  // 10. input UTXO amount (u64 LE)
  preimage.writeBigUInt64LE(BigInt(input.amount), offset);
  offset += 8;
  // 11. input.sequence (u64 LE)
  preimage.writeBigUInt64LE(BigInt(input.sequence || '0'), offset);
  offset += 8;
  // 12. input.sigOpCount (u8)
  preimage.writeUInt8(input.sigOpCount ?? 1, offset);
  offset += 1;
  // 13. outputsHash
  outsHash.copy(preimage, offset);
  offset += 32;
  // 14. tx.lockTime (u64 LE)
  preimage.writeBigUInt64LE(BigInt(tx.lockTime || '0'), offset);
  offset += 8;
  // 15. tx.subnetworkId (20 bytes)
  subnetId.copy(preimage, offset);
  offset += 20;
  // 16. tx.gas (u64 LE) — always 0 for native KASPA
  preimage.writeBigUInt64LE(0n, offset);
  offset += 8;
  // 17. payloadHash
  payloadHash.copy(preimage, offset);
  offset += 32;
  // 18. sigHashType (u8)
  preimage.writeUInt8(sigHashType, offset);
  offset += 1;

  return kblake2b(preimage.slice(0, offset));
}
