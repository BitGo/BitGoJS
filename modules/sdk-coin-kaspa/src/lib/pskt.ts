/**
 * PSKT — Partially Signed Kaspa Transaction
 *
 * Kaspa's native analogue of Bitcoin's PSBT (BIP-174), implemented in
 * TypeScript with zero external dependencies. Wire format is plain camelCase
 * JSON, matching the serde serialisation of rusty-kaspa's wallet/pskt crate.
 *
 * Reference: https://github.com/kaspanet/rusty-kaspa/tree/master/wallet/pskt
 *
 * Role state machine:
 *   CREATOR → UPDATER → SIGNER ─┬→ COMBINER → FINALIZER → EXTRACTOR
 *                                └──────────→ FINALIZER → EXTRACTOR
 *
 * Key difference from the current JSON-hex flow:
 *   Signatures are stored in `partialSigs` per input until the FINALIZER
 *   role promotes them into the push-only `finalScriptSig`. This lets an
 *   external HSM or a second party receive the serialised PSKT, call
 *   `addSignature()`, and return it — identical to how PSBT works for BTC.
 */

import { ecc } from '@bitgo/secp256k1';
import { KaspaTransactionData, KaspaUtxoInput, KaspaTransactionOutput } from './iface';
import { computeKaspaSigningHash, SIGHASH_ALL } from './sighash';
import { KeyPair } from './keyPair';

// ─── Role types ───────────────────────────────────────────────────────────────

export type PsktRole = 'CREATOR' | 'UPDATER' | 'SIGNER' | 'COMBINER' | 'FINALIZER' | 'EXTRACTOR';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PsktKeySource {
  /** 4-byte master fingerprint, hex-encoded */
  keyFingerprint: string;
  /** BIP-32 derivation path string, e.g. "m/44'/111111'/0'/0/0" */
  derivationPath: string;
}

export interface PsktGlobal {
  /** PSKT version (0 = no payload, 1 = payload allowed) */
  version: 0 | 1;
  /** Kaspa transaction version (currently 0) */
  txVersion: number;
  /** Fallback lock time (block or timestamp), as decimal string for JSON safety */
  fallbackLockTime?: string;
  /** Whether inputs can still be added */
  inputsModifiable: boolean;
  /** Whether outputs can still be added */
  outputsModifiable: boolean;
  /** Number of inputs in this PSKT */
  inputCount: number;
  /** Number of outputs in this PSKT */
  outputCount: number;
  /** Extended public keys and their derivation info */
  xpubs: Record<string, PsktKeySource>;
  /** Transaction ID once known */
  id?: string;
  /** Proprietary key-value pairs */
  proprietaries: Record<string, unknown>;
  /** Hex-encoded transaction payload (requires version >= 1) */
  payload?: string;
}

export interface PsktUtxoEntry {
  /** Amount in sompi (decimal string for JSON bigint safety) */
  amount: string;
  /** Hex-encoded scriptPublicKey bytes */
  scriptPublicKey: string;
  blockDaaScore?: string;
  isCoinbase?: boolean;
}

export interface PsktInput {
  /** The outpoint being spent */
  previousOutpoint: { transactionId: string; index: number };
  /**
   * UTXO data required for sighash computation.
   * Must be present before signing.
   */
  utxoEntry?: PsktUtxoEntry;
  /** Sequence number (u64 as decimal string; absent = u64::MAX / finality) */
  sequence?: string;
  /**
   * Partial Schnorr signatures collected so far.
   * Key: 33-byte compressed secp256k1 pubKey hex.
   * Value: 64-byte raw Schnorr signature hex.
   */
  partialSigs: Record<string, string>;
  /** SigHash type for this input (default: SIGHASH_ALL = 0x01) */
  sighashType: number;
  /** Signature operation count */
  sigOpCount?: number;
  /**
   * Finalized scriptSig (set by the FINALIZER role).
   * Layout: 0x41 (OP_DATA_65) + 64-byte sig + 1-byte sighash type = 66 bytes hex.
   */
  finalScriptSig?: string;
  /** BIP-32 derivation info for keys used in this input */
  bip32Derivations: Record<string, PsktKeySource>;
  /** Proprietary key-value pairs */
  proprietaries: Record<string, unknown>;
}

export interface PsktOutput {
  /** Amount in sompi (decimal string for JSON bigint safety) */
  amount: string;
  /** Script public key */
  scriptPublicKey: { version: number; scriptPublicKey: string };
  /** BIP-32 derivation info for keys used in this output */
  bip32Derivations: Record<string, PsktKeySource>;
  /** Proprietary key-value pairs */
  proprietaries: Record<string, unknown>;
}

/** Wire format — what `serialize()` produces and `deserialize()` consumes. */
export interface SerializedPskt {
  role: PsktRole;
  global: PsktGlobal;
  inputs: PsktInput[];
  outputs: PsktOutput[];
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function requireRole(current: PsktRole, ...allowed: PsktRole[]): void {
  if (!allowed.includes(current)) {
    throw new Error(`Operation requires role ${allowed.join(' or ')}, but current role is ${current}`);
  }
}

/**
 * Build a `KaspaTransactionData` from PSKT internals, for use with
 * `computeKaspaSigningHash`. Every input must have `utxoEntry` populated.
 */
function psktToKaspaTxData(global: PsktGlobal, inputs: PsktInput[], outputs: PsktOutput[]): KaspaTransactionData {
  const kaspaInputs: KaspaUtxoInput[] = inputs.map((inp, i) => {
    if (!inp.utxoEntry) {
      throw new Error(
        `Input[${i}] (${inp.previousOutpoint.transactionId}:${inp.previousOutpoint.index}) ` +
          `is missing utxoEntry — required for sighash computation`
      );
    }
    return {
      transactionId: inp.previousOutpoint.transactionId,
      transactionIndex: inp.previousOutpoint.index,
      amount: inp.utxoEntry.amount,
      scriptPublicKey: inp.utxoEntry.scriptPublicKey,
      sequence: inp.sequence,
      sigOpCount: inp.sigOpCount ?? 1,
    };
  });

  const kaspaOutputs: KaspaTransactionOutput[] = outputs.map((out) => ({
    address: '',
    amount: out.amount,
    scriptPublicKey: out.scriptPublicKey.scriptPublicKey,
  }));

  return {
    version: global.txVersion,
    inputs: kaspaInputs,
    outputs: kaspaOutputs,
    lockTime: global.fallbackLockTime ?? '0',
    subnetworkId: '0000000000000000000000000000000000000000',
    payload: global.payload ?? '',
  };
}

// ─── Pskt class ───────────────────────────────────────────────────────────────

/**
 * PSKT (Partially Signed Kaspa Transaction).
 *
 * Mirrors the role-based workflow of Bitcoin's PSBT but uses Kaspa's wire
 * format (camelCase JSON), Blake2b sighash, and Schnorr signatures.
 *
 * Typical single-signer flow:
 * ```ts
 * const pskt = Pskt.creator()
 *   .toUpdater()
 *   .input({ ... })
 *   .output({ ... })
 *   .toSigner()
 *   .sign(privateKeyBuffer)
 *   .toFinalizer()
 *   .finalize()
 *   .toExtractor();
 *
 * const broadcastJson = pskt.extract();
 * ```
 *
 * HSM / external signing flow:
 * ```ts
 * const unsigned = pskt.serialize();          // send to HSM
 * const signed   = Pskt.deserialize(signed);  // receive back
 * const tx       = signed.toFinalizer().finalize().toExtractor().extract();
 * ```
 */
export class Pskt {
  private _global: PsktGlobal;
  private _inputs: PsktInput[];
  private _outputs: PsktOutput[];
  private _role: PsktRole;

  private constructor(global: PsktGlobal, inputs: PsktInput[], outputs: PsktOutput[], role: PsktRole) {
    this._global = { ...global };
    this._inputs = inputs.map((inp) => ({ ...inp, partialSigs: { ...inp.partialSigs } }));
    this._outputs = outputs.map((out) => ({ ...out }));
    this._role = role;
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get role(): PsktRole {
    return this._role;
  }

  get global(): Readonly<PsktGlobal> {
    return this._global;
  }

  get inputs(): ReadonlyArray<Readonly<PsktInput>> {
    return this._inputs;
  }

  get outputs(): ReadonlyArray<Readonly<PsktOutput>> {
    return this._outputs;
  }

  // ── Static factories ───────────────────────────────────────────────────────

  /**
   * Create a new PSKT in CREATOR role.
   *
   * @param txVersion       Kaspa transaction version (currently 0)
   * @param fallbackLockTime Optional lock time as decimal string
   */
  static creator(txVersion = 0, fallbackLockTime?: string): Pskt {
    const global: PsktGlobal = {
      version: 0,
      txVersion,
      fallbackLockTime,
      inputsModifiable: true,
      outputsModifiable: true,
      inputCount: 0,
      outputCount: 0,
      xpubs: {},
      proprietaries: {},
    };
    return new Pskt(global, [], [], 'CREATOR');
  }

  /**
   * Reconstruct a PSKT from a `KaspaTransactionData` object.
   *
   * The returned PSKT is placed in SIGNER role (inputs are locked, UTXO data
   * is populated, any existing `signatureScript` is carried as `finalScriptSig`).
   * Used by `Transaction.toPskt()`.
   */
  static fromTxData(txData: KaspaTransactionData): Pskt {
    const global: PsktGlobal = {
      version: 0,
      txVersion: txData.version,
      fallbackLockTime: txData.lockTime ?? '0',
      inputsModifiable: false,
      outputsModifiable: false,
      inputCount: txData.inputs.length,
      outputCount: txData.outputs.length,
      xpubs: {},
      proprietaries: {},
      payload: txData.payload,
    };

    const inputs: PsktInput[] = txData.inputs.map((inp) => ({
      previousOutpoint: { transactionId: inp.transactionId, index: inp.transactionIndex },
      utxoEntry: { amount: inp.amount, scriptPublicKey: inp.scriptPublicKey },
      sequence: inp.sequence,
      sigOpCount: inp.sigOpCount,
      partialSigs: {},
      sighashType: SIGHASH_ALL,
      // Carry any existing signatureScript as the finalScriptSig
      finalScriptSig: inp.signatureScript,
      bip32Derivations: {},
      proprietaries: {},
    }));

    const outputs: PsktOutput[] = txData.outputs.map((out) => ({
      amount: out.amount,
      scriptPublicKey: { version: 0, scriptPublicKey: out.scriptPublicKey || '' },
      bip32Derivations: {},
      proprietaries: {},
    }));

    return new Pskt(global, inputs, outputs, 'SIGNER');
  }

  /**
   * Deserialise a PSKT from the JSON string produced by `serialize()`.
   */
  static deserialize(json: string): Pskt {
    const data = JSON.parse(json) as SerializedPskt;
    if (!data.role || !data.global || !Array.isArray(data.inputs) || !Array.isArray(data.outputs)) {
      throw new Error('Invalid PSKT JSON: missing required fields');
    }
    return new Pskt(data.global, data.inputs, data.outputs, data.role);
  }

  // ── Role transitions ───────────────────────────────────────────────────────

  toUpdater(): Pskt {
    requireRole(this._role, 'CREATOR');
    return new Pskt(this._global, this._inputs, this._outputs, 'UPDATER');
  }

  toSigner(): Pskt {
    requireRole(this._role, 'UPDATER');
    // Lock structure before signing
    return new Pskt(
      { ...this._global, inputsModifiable: false, outputsModifiable: false },
      this._inputs,
      this._outputs,
      'SIGNER'
    );
  }

  toCombiner(): Pskt {
    requireRole(this._role, 'SIGNER');
    return new Pskt(this._global, this._inputs, this._outputs, 'COMBINER');
  }

  /**
   * Transition to FINALIZER role.
   * Allowed from both SIGNER (single-party shortcut) and COMBINER.
   */
  toFinalizer(): Pskt {
    requireRole(this._role, 'SIGNER', 'COMBINER');
    return new Pskt(this._global, this._inputs, this._outputs, 'FINALIZER');
  }

  /**
   * Transition to EXTRACTOR role.
   * All inputs must have a `finalScriptSig` (call `finalize()` first).
   */
  toExtractor(): Pskt {
    requireRole(this._role, 'FINALIZER');
    for (let i = 0; i < this._inputs.length; i++) {
      if (!this._inputs[i].finalScriptSig) {
        throw new Error(`Input[${i}] is not finalised — call finalize() before toExtractor()`);
      }
    }
    return new Pskt(this._global, this._inputs, this._outputs, 'EXTRACTOR');
  }

  // ── CREATOR / UPDATER mutations ────────────────────────────────────────────

  /**
   * Add an input. Only allowed in CREATOR or UPDATER role.
   */
  input(inp: PsktInput): this {
    requireRole(this._role, 'CREATOR', 'UPDATER');
    if (!this._global.inputsModifiable) {
      throw new Error('Inputs are locked (inputsModifiable = false)');
    }
    this._inputs.push({ ...inp, partialSigs: { ...inp.partialSigs } });
    this._global.inputCount = this._inputs.length;
    return this;
  }

  /**
   * Add an output. Only allowed in CREATOR or UPDATER role.
   */
  output(out: PsktOutput): this {
    requireRole(this._role, 'CREATOR', 'UPDATER');
    if (!this._global.outputsModifiable) {
      throw new Error('Outputs are locked (outputsModifiable = false)');
    }
    this._outputs.push({ ...out });
    this._global.outputCount = this._outputs.length;
    return this;
  }

  // ── SIGNER operations ──────────────────────────────────────────────────────

  /**
   * Sign all inputs with a private key (single-key / non-HSM path).
   *
   * Computes a distinct keyed Blake2b-256 sighash per input (Kaspa's
   * BIP-143-like scheme) and writes the 64-byte Schnorr signature into
   * `partialSigs[compressedPubKeyHex]` for each input.
   *
   * @param privateKey  32-byte private key buffer
   * @param sigHashType SigHash type (default: SIGHASH_ALL = 0x01)
   */
  sign(privateKey: Buffer, sigHashType: number = SIGHASH_ALL): this {
    requireRole(this._role, 'SIGNER');
    if (privateKey.length !== 32) {
      throw new Error(`Expected 32-byte private key, got ${privateKey.length}`);
    }

    // Derive the compressed public key using the existing KeyPair infrastructure
    const kp = new KeyPair({ prv: privateKey.toString('hex') });
    const pubKeyHex = kp.getKeys().pub as string;

    const txData = psktToKaspaTxData(this._global, this._inputs, this._outputs);

    for (let i = 0; i < this._inputs.length; i++) {
      const inputSighashType = this._inputs[i].sighashType ?? sigHashType;
      const sigHash = computeKaspaSigningHash(txData, i, inputSighashType);
      const sig = Buffer.from(ecc.signSchnorr(sigHash, privateKey));
      this._inputs[i].partialSigs[pubKeyHex] = sig.toString('hex');
    }

    return this;
  }

  /**
   * Record an externally-produced Schnorr signature for one specific input.
   *
   * HSM / MPCv2 flow:
   * ```ts
   * const json  = pskt.serialize();                  // → HSM
   * // HSM signs each input's sighash and returns signatures
   * pskt.addSignature(0, pubKeyHex, sig0Hex)
   *     .addSignature(1, pubKeyHex, sig1Hex);
   * ```
   *
   * @param inputIndex  0-based index of the input being signed
   * @param pubKeyHex   33-byte compressed secp256k1 pubKey, hex-encoded
   * @param sigHex      64-byte Schnorr signature, hex-encoded
   * @param sigHashType SigHash type used when producing the signature
   */
  addSignature(inputIndex: number, pubKeyHex: string, sigHex: string, sigHashType: number = SIGHASH_ALL): this {
    requireRole(this._role, 'SIGNER');
    if (inputIndex < 0 || inputIndex >= this._inputs.length) {
      throw new Error(`Input index ${inputIndex} is out of range (tx has ${this._inputs.length} inputs)`);
    }
    const sigBuf = Buffer.from(sigHex, 'hex');
    if (sigBuf.length !== 64) {
      throw new Error(`Expected 64-byte Schnorr signature, got ${sigBuf.length} bytes`);
    }
    this._inputs[inputIndex].partialSigs[pubKeyHex] = sigHex;
    this._inputs[inputIndex].sighashType = sigHashType;
    return this;
  }

  // ── COMBINER operation ─────────────────────────────────────────────────────

  /**
   * Merge `partialSigs` from another PSKT into this one.
   *
   * Both PSKTs must represent the same transaction (same number of inputs and
   * outputs). Conflicting signatures for the same pubKey raise an error.
   */
  combine(other: Pskt): this {
    requireRole(this._role, 'COMBINER');
    if (other._inputs.length !== this._inputs.length) {
      throw new Error(
        `Cannot combine: input count mismatch (this=${this._inputs.length}, other=${other._inputs.length})`
      );
    }
    if (other._outputs.length !== this._outputs.length) {
      throw new Error(
        `Cannot combine: output count mismatch (this=${this._outputs.length}, other=${other._outputs.length})`
      );
    }
    for (let i = 0; i < this._inputs.length; i++) {
      for (const [pubKey, sig] of Object.entries(other._inputs[i].partialSigs)) {
        const existing = this._inputs[i].partialSigs[pubKey];
        if (existing && existing !== sig) {
          throw new Error(`Conflicting signature for input[${i}] pubKey ${pubKey.slice(0, 16)}...`);
        }
        this._inputs[i].partialSigs[pubKey] = sig;
      }
    }
    return this;
  }

  // ── FINALIZER operation ────────────────────────────────────────────────────

  /**
   * Finalise all inputs: promote the first `partialSig` on each input into
   * `finalScriptSig` using Kaspa's push-only script layout:
   *   `0x41` (OP_DATA_65) + 64-byte Schnorr sig + 1-byte sighash type = 66 bytes
   *
   * Inputs that already have a `finalScriptSig` are left unchanged.
   */
  finalize(): this {
    requireRole(this._role, 'FINALIZER');
    for (let i = 0; i < this._inputs.length; i++) {
      const inp = this._inputs[i];
      if (inp.finalScriptSig) {
        continue;
      }
      const entries = Object.entries(inp.partialSigs);
      if (entries.length === 0) {
        throw new Error(`Input[${i}] has no partial signatures — cannot finalise`);
      }
      const [, sigHex] = entries[0];
      const sig = Buffer.from(sigHex, 'hex');
      if (sig.length !== 64) {
        throw new Error(`Input[${i}] partial signature is ${sig.length} bytes, expected 64`);
      }
      const sighashType = inp.sighashType ?? SIGHASH_ALL;
      // Push-only scriptSig: OP_DATA_65 + 64-byte sig + 1-byte sighash type
      inp.finalScriptSig = Buffer.concat([Buffer.from([0x41]), sig, Buffer.from([sighashType])]).toString('hex');
    }
    return this;
  }

  // ── EXTRACTOR operation ────────────────────────────────────────────────────

  /**
   * Extract the broadcast-ready transaction as a JSON string.
   *
   * Produces the same wire format as `Transaction.toBroadcastFormat()`.
   * Must be in EXTRACTOR role (call `.toFinalizer().finalize().toExtractor()` first).
   */
  extract(): string {
    requireRole(this._role, 'EXTRACTOR');
    return JSON.stringify({
      version: this._global.txVersion,
      inputs: this._inputs.map((inp) => ({
        previousOutpoint: {
          transactionId: inp.previousOutpoint.transactionId,
          index: inp.previousOutpoint.index,
        },
        signatureScript: inp.finalScriptSig || '',
        sequence: Number(inp.sequence ?? 0),
        sigOpCount: inp.sigOpCount ?? 1,
      })),
      outputs: this._outputs.map((out) => ({
        amount: Number(out.amount),
        scriptPublicKey: {
          version: out.scriptPublicKey.version,
          scriptPublicKey: out.scriptPublicKey.scriptPublicKey,
        },
      })),
      lockTime: Number(this._global.fallbackLockTime ?? 0),
      subnetworkId: '0000000000000000000000000000000000000000',
      gas: 0,
      payload: this._global.payload ?? '',
    });
  }

  // ── Serialization ──────────────────────────────────────────────────────────

  /**
   * Serialise the PSKT to a JSON string for transmission (e.g. to an HSM).
   * The `role` is included so `Pskt.deserialize()` can reconstruct the state.
   */
  serialize(): string {
    const wire: SerializedPskt = {
      role: this._role,
      global: this._global,
      inputs: this._inputs,
      outputs: this._outputs,
    };
    return JSON.stringify(wire);
  }

  /**
   * Convert the PSKT's internal data back to a `KaspaTransactionData` object.
   *
   * `finalScriptSig` (if present) is mapped to `signatureScript` so that the
   * resulting `Transaction` is fully signed and ready to broadcast.
   * Used by `Transaction.fromPskt()`.
   */
  toTxData(): KaspaTransactionData {
    return {
      version: this._global.txVersion,
      inputs: this._inputs.map((inp) => ({
        transactionId: inp.previousOutpoint.transactionId,
        transactionIndex: inp.previousOutpoint.index,
        amount: inp.utxoEntry?.amount ?? '0',
        scriptPublicKey: inp.utxoEntry?.scriptPublicKey ?? '',
        sequence: inp.sequence,
        sigOpCount: inp.sigOpCount,
        signatureScript: inp.finalScriptSig,
      })),
      outputs: this._outputs.map((out) => ({
        address: '',
        amount: out.amount,
        scriptPublicKey: out.scriptPublicKey.scriptPublicKey,
      })),
      lockTime: this._global.fallbackLockTime ?? '0',
      subnetworkId: '0000000000000000000000000000000000000000',
      payload: this._global.payload ?? '',
    };
  }
}
