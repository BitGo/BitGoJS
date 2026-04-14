/**
 * Kaspa (KAS) Transaction
 *
 * Represents a Kaspa UTXO transaction. Handles serialization and
 * sighash computation for Schnorr signing.
 *
 * Kaspa transaction sighash follows a BIP143-like approach using BLAKE2B
 * with the domain tag "TransactionSigningHash".
 */

import { BaseTransaction } from '@bitgo/sdk-core';
import { blake2b } from '@noble/hashes/blake2b';
import {
  KaspaTransactionData,
  KaspaTransactionInput,
  KaspaTransactionOutput,
  KaspaTransactionExplanation,
} from './iface';
import {
  TX_VERSION,
  NATIVE_SUBNETWORK_ID,
  DEFAULT_GAS,
  DEFAULT_LOCK_TIME,
  SIGHASH_ALL,
  HASH_SIZE,
  SIGHASH_DOMAIN_TAG,
} from './constants';
import { uint64ToLE, uint32ToLE, uint16ToLE, writeVarInt, serializeTxId } from './utils';

/**
 * Compute a BLAKE2B hash with a Kaspa domain tag prefix.
 * Kaspa prepends each hash with: BLAKE2B(domain_tag) || data
 */
function blake2bWithTag(tag: string, data: Buffer): Buffer {
  // Kaspa uses a tagged hash: H(tag_length || tag || data)
  // The tag is hashed separately and prepended as a "personalization"
  const tagBuf = Buffer.from(tag, 'utf8');
  const hasher = blake2b.create({ dkLen: HASH_SIZE });
  hasher.update(tagBuf);
  hasher.update(data);
  return Buffer.from(hasher.digest());
}

/**
 * Hash a buffer using BLAKE2B (no tag, plain hash).
 */
function hashBuf(data: Buffer): Buffer {
  return Buffer.from(blake2b(data, { dkLen: HASH_SIZE }));
}

export class Transaction extends BaseTransaction {
  protected _txData: KaspaTransactionData;

  constructor(txData?: Partial<KaspaTransactionData>) {
    super({} as any);
    this._txData = {
      version: TX_VERSION,
      inputs: [],
      outputs: [],
      lockTime: DEFAULT_LOCK_TIME,
      subnetworkId: NATIVE_SUBNETWORK_ID.toString('hex'),
      gas: DEFAULT_GAS,
      payload: '',
      ...(txData || {}),
    };
  }

  get txData(): KaspaTransactionData {
    return this._txData;
  }

  /** @inheritdoc */
  get id(): string {
    return this.transactionId();
  }

  /** @inheritdoc */
  canSign(): boolean {
    return true;
  }

  /**
   * Compute the transaction ID (BLAKE2B hash of the serialized transaction without signatures).
   */
  transactionId(): string {
    const serialized = this.serializeForTxId();
    return hashBuf(serialized).toString('hex');
  }

  /**
   * Serialize the transaction for ID calculation (no signature scripts).
   */
  private serializeForTxId(): Buffer {
    const parts: Buffer[] = [];

    // Version (2 bytes LE)
    parts.push(uint16ToLE(this._txData.version));

    // Inputs
    parts.push(writeVarInt(this._txData.inputs.length));
    for (const input of this._txData.inputs) {
      // Previous outpoint: txid (32 bytes) + index (4 bytes LE)
      parts.push(serializeTxId(input.previousOutpoint.transactionId));
      parts.push(uint32ToLE(input.previousOutpoint.index));
      // For txid calculation, signature script is empty
      parts.push(writeVarInt(0));
      // Sequence (8 bytes LE)
      parts.push(uint64ToLE(input.sequence));
      // SigOpCount (1 byte)
      parts.push(Buffer.from([input.sigOpCount]));
    }

    // Outputs
    parts.push(writeVarInt(this._txData.outputs.length));
    for (const output of this._txData.outputs) {
      parts.push(serializeOutput(output));
    }

    // LockTime (8 bytes LE)
    parts.push(uint64ToLE(this._txData.lockTime));

    // SubnetworkID (20 bytes)
    const subnetworkId = Buffer.from(this._txData.subnetworkId, 'hex');
    parts.push(subnetworkId);

    // Gas (8 bytes LE)
    parts.push(uint64ToLE(this._txData.gas));

    // Payload
    const payload = this._txData.payload ? Buffer.from(this._txData.payload, 'hex') : Buffer.alloc(0);
    parts.push(writeVarInt(payload.length));
    if (payload.length > 0) parts.push(payload);

    return Buffer.concat(parts);
  }

  /**
   * Compute the sighash for a specific input using Kaspa's signing algorithm.
   *
   * Kaspa sighash uses BLAKE2B with the "TransactionSigningHash" tag and commits
   * to: previous outpoints, sequences, sigop counts, this input's UTXO details,
   * all outputs, locktime, subnetwork, gas, payload, and sighash type.
   *
   * @param inputIndex - Index of the input being signed
   * @param sighashType - Sighash type (default: SIGHASH_ALL = 0x01)
   */
  computeSighash(inputIndex: number, sighashType: number = SIGHASH_ALL): Buffer {
    if (!this._txData.utxoEntries || this._txData.utxoEntries.length !== this._txData.inputs.length) {
      throw new Error('UTXO entries required for sighash computation');
    }

    const parts: Buffer[] = [];

    // 1. Version (2 bytes LE)
    parts.push(uint16ToLE(this._txData.version));

    // 2. Hash of all previous outpoints
    const outpointsHash = this.hashOutpoints();
    parts.push(outpointsHash);

    // 3. Hash of all sequences
    const sequencesHash = this.hashSequences();
    parts.push(sequencesHash);

    // 4. Hash of all sigop counts
    const sigopCountsHash = this.hashSigOpCounts();
    parts.push(sigopCountsHash);

    // 5. This input's outpoint
    const input = this._txData.inputs[inputIndex];
    parts.push(serializeTxId(input.previousOutpoint.transactionId));
    parts.push(uint32ToLE(input.previousOutpoint.index));

    // 6. This input's UTXO script public key
    const utxo = this._txData.utxoEntries[inputIndex];
    const scriptBytes = Buffer.from(utxo.scriptPublicKey.script, 'hex');
    parts.push(uint16ToLE(utxo.scriptPublicKey.version));
    parts.push(writeVarInt(scriptBytes.length));
    parts.push(scriptBytes);

    // 7. This input's value (8 bytes LE)
    parts.push(uint64ToLE(utxo.amount));

    // 8. This input's block DAA score (8 bytes LE)
    parts.push(uint64ToLE(utxo.blockDaaScore));

    // 9. This input's is_coinbase (1 byte)
    parts.push(Buffer.from([utxo.isCoinbase ? 1 : 0]));

    // 10. This input's sequence (8 bytes LE)
    parts.push(uint64ToLE(input.sequence));

    // 11. This input's sigop count (1 byte)
    parts.push(Buffer.from([input.sigOpCount]));

    // 12. Hash of all outputs
    const outputsHash = this.hashOutputs();
    parts.push(outputsHash);

    // 13. LockTime (8 bytes LE)
    parts.push(uint64ToLE(this._txData.lockTime));

    // 14. SubnetworkID (20 bytes)
    parts.push(Buffer.from(this._txData.subnetworkId, 'hex'));

    // 15. Gas (8 bytes LE)
    parts.push(uint64ToLE(this._txData.gas));

    // 16. Payload hash
    const payload = this._txData.payload ? Buffer.from(this._txData.payload, 'hex') : Buffer.alloc(0);
    parts.push(hashBuf(payload));

    // 17. Sighash type (1 byte)
    parts.push(Buffer.from([sighashType]));

    return blake2bWithTag(SIGHASH_DOMAIN_TAG, Buffer.concat(parts));
  }

  private hashOutpoints(): Buffer {
    const parts: Buffer[] = [];
    for (const input of this._txData.inputs) {
      parts.push(serializeTxId(input.previousOutpoint.transactionId));
      parts.push(uint32ToLE(input.previousOutpoint.index));
    }
    return hashBuf(Buffer.concat(parts));
  }

  private hashSequences(): Buffer {
    const parts: Buffer[] = [];
    for (const input of this._txData.inputs) {
      parts.push(uint64ToLE(input.sequence));
    }
    return hashBuf(Buffer.concat(parts));
  }

  private hashSigOpCounts(): Buffer {
    const parts: Buffer[] = [];
    for (const input of this._txData.inputs) {
      parts.push(Buffer.from([input.sigOpCount]));
    }
    return hashBuf(Buffer.concat(parts));
  }

  private hashOutputs(): Buffer {
    const parts: Buffer[] = [];
    for (const output of this._txData.outputs) {
      parts.push(serializeOutput(output));
    }
    return hashBuf(Buffer.concat(parts));
  }

  /**
   * Serialize the transaction to a hex string (with signatures).
   * Used for broadcasting to the network.
   */
  toBroadcastFormat(): string {
    return this.serialize().toString('hex');
  }

  /**
   * Serialize the transaction to a Buffer (with signatures).
   */
  serialize(): Buffer {
    const parts: Buffer[] = [];

    // Version (2 bytes LE)
    parts.push(uint16ToLE(this._txData.version));

    // Inputs
    parts.push(writeVarInt(this._txData.inputs.length));
    for (const input of this._txData.inputs) {
      parts.push(serializeTxId(input.previousOutpoint.transactionId));
      parts.push(uint32ToLE(input.previousOutpoint.index));
      const sigScript = input.signatureScript ? Buffer.from(input.signatureScript, 'hex') : Buffer.alloc(0);
      parts.push(writeVarInt(sigScript.length));
      if (sigScript.length > 0) parts.push(sigScript);
      parts.push(uint64ToLE(input.sequence));
      parts.push(Buffer.from([input.sigOpCount]));
    }

    // Outputs
    parts.push(writeVarInt(this._txData.outputs.length));
    for (const output of this._txData.outputs) {
      parts.push(serializeOutput(output));
    }

    // LockTime (8 bytes LE)
    parts.push(uint64ToLE(this._txData.lockTime));

    // SubnetworkID (20 bytes)
    parts.push(Buffer.from(this._txData.subnetworkId, 'hex'));

    // Gas (8 bytes LE)
    parts.push(uint64ToLE(this._txData.gas));

    // Payload
    const payload = this._txData.payload ? Buffer.from(this._txData.payload, 'hex') : Buffer.alloc(0);
    parts.push(writeVarInt(payload.length));
    if (payload.length > 0) parts.push(payload);

    return Buffer.concat(parts);
  }

  /**
   * Deserialize a transaction from hex.
   */
  static fromHex(hex: string): Transaction {
    return Transaction.deserialize(Buffer.from(hex, 'hex'));
  }

  /**
   * Deserialize a transaction from a Buffer.
   */
  static deserialize(buf: Buffer): Transaction {
    let offset = 0;

    const readUInt16LE = (): number => {
      const val = buf.readUInt16LE(offset);
      offset += 2;
      return val;
    };

    const readUInt32LE = (): number => {
      const val = buf.readUInt32LE(offset);
      offset += 4;
      return val;
    };

    const readUInt64LE = (): bigint => {
      const val = buf.readBigUInt64LE(offset);
      offset += 8;
      return val;
    };

    const readVarInt = (): number => {
      const first = buf[offset++];
      if (first < 0xfd) return first;
      if (first === 0xfd) {
        const val = buf.readUInt16LE(offset);
        offset += 2;
        return val;
      }
      if (first === 0xfe) {
        const val = buf.readUInt32LE(offset);
        offset += 4;
        return val;
      }
      const val = buf.readBigUInt64LE(offset);
      offset += 8;
      if (val > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error(`VarInt value ${val} exceeds Number.MAX_SAFE_INTEGER and cannot be safely represented`);
      }
      return Number(val);
    };

    const readBytes = (n: number): Buffer => {
      const bytes = buf.slice(offset, offset + n);
      offset += n;
      return bytes;
    };

    const version = readUInt16LE();
    const inputCount = readVarInt();
    const inputs: KaspaTransactionInput[] = [];

    for (let i = 0; i < inputCount; i++) {
      const txId = readBytes(32).toString('hex');
      const index = readUInt32LE();
      const scriptLen = readVarInt();
      const signatureScript = scriptLen > 0 ? readBytes(scriptLen).toString('hex') : '';
      const sequence = readUInt64LE();
      const sigOpCount = buf[offset++];
      inputs.push({
        previousOutpoint: { transactionId: txId, index },
        signatureScript,
        sequence,
        sigOpCount,
      });
    }

    const outputCount = readVarInt();
    const outputs: KaspaTransactionOutput[] = [];

    for (let i = 0; i < outputCount; i++) {
      const value = readUInt64LE();
      const scriptVersion = readUInt16LE();
      const scriptLen = readVarInt();
      const script = readBytes(scriptLen).toString('hex');
      outputs.push({
        value,
        scriptPublicKey: { version: scriptVersion, script },
      });
    }

    const lockTime = readUInt64LE();
    const subnetworkId = readBytes(20).toString('hex');
    const gas = readUInt64LE();
    const payloadLen = readVarInt();
    const payload = payloadLen > 0 ? readBytes(payloadLen).toString('hex') : '';

    return new Transaction({ version, inputs, outputs, lockTime, subnetworkId, gas, payload });
  }

  /**
   * Explain this transaction in human-readable form.
   */
  explainTransaction(): KaspaTransactionExplanation {
    const outputs = this._txData.outputs.map((o) => ({
      address: '', // address derivation from script requires additional context
      amount: o.value.toString(),
    }));

    const totalOut = this._txData.outputs.reduce((sum, o) => sum + o.value, BigInt(0));

    return {
      id: this.transactionId(),
      outputs,
      outputAmount: totalOut.toString(),
      fee: { fee: '0' }, // fee = total in - total out, requires UTXO entries
      type: 'transfer',
      changeOutputs: [],
      changeAmount: '0',
    };
  }

  /** @inheritdoc */
  toJson(): KaspaTransactionData {
    return {
      ...this._txData,
      inputs: this._txData.inputs.map((i) => ({ ...i })),
      outputs: this._txData.outputs.map((o) => ({ ...o })),
    };
  }

  /** Signatures on this transaction (as hex strings) */
  get signature(): string[] {
    return this._txData.inputs.map((i) => i.signatureScript).filter(Boolean);
  }
}

/**
 * Serialize a transaction output.
 */
function serializeOutput(output: KaspaTransactionOutput): Buffer {
  const scriptBytes = Buffer.from(output.scriptPublicKey.script, 'hex');
  return Buffer.concat([
    uint64ToLE(output.value),
    uint16ToLE(output.scriptPublicKey.version),
    writeVarInt(scriptBytes.length),
    scriptBytes,
  ]);
}
