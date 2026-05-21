import { BaseKey, BaseTransaction, TransactionType } from '@bitgo/sdk-core';
import { ecc } from '@bitgo/secp256k1';
import { KaspaTransactionData, KaspaUtxoInput, TransactionExplanation } from './iface';
import { computeKaspaSigningHash, computeKaspaEcdsaSigningHash } from './sighash';
import { OP_CHECKSIG_ECDSA, SIGHASH_ALL } from './constants';
import { Pskt } from './pskt';

/**
 * Returns true when `input`'s scriptPublicKey belongs to a Kaspa ECDSA (v1)
 * address — last opcode is OpCheckSigECDSA (0xAB).
 * Schnorr (v0) scripts end with OpCheckSig (0xAC).
 */
function isEcdsaInput(input: KaspaUtxoInput): boolean {
  if (!input.scriptPublicKey || input.scriptPublicKey.length < 2) return false;
  return parseInt(input.scriptPublicKey.slice(-2), 16) === OP_CHECKSIG_ECDSA;
}

export class Transaction extends BaseTransaction {
  protected _txData: KaspaTransactionData;

  constructor(coin: string, txData?: KaspaTransactionData) {
    // BaseTransaction expects a full statics CoinConfig; we only have the coin name string here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super({ coin } as any);
    this._txData = txData || {
      version: 0,
      inputs: [],
      outputs: [],
    };
  }

  /** @inheritDoc */
  get id(): string {
    return this._txData.id || '';
  }

  get txData(): KaspaTransactionData {
    return this._txData;
  }

  /**
   * Get the transaction fee in sompi.
   * If fee was explicitly set, returns that. Otherwise computes from inputs - outputs.
   */
  get fee(): string {
    if (this._txData.fee) {
      return this._txData.fee;
    }
    let totalIn = BigInt(0);
    let totalOut = BigInt(0);
    for (const input of this._txData.inputs) {
      totalIn += BigInt(input.amount);
    }
    for (const output of this._txData.outputs) {
      totalOut += BigInt(output.amount);
    }
    return (totalIn - totalOut).toString();
  }

  /**
   * Returns one sighash Buffer per input — the set of messages that must be
   * signed for a multi-input MPCv2 ceremony.
   *
   * Kaspa uses a BIP-143-like sighash scheme (Blake2b) where each input commits
   * to its own index, so input[i] has a distinct hash that cannot be re-used for
   * input[j]. A correct multi-input MPCv2 flow runs one DKLS session per input
   * in parallel and applies each resulting signature via addSignatureForInput().
   *
   * The hash type is automatically selected per input:
   *   - Schnorr (scriptPublicKey ends 0xAC): keyed Blake2b-256
   *   - ECDSA   (scriptPublicKey ends 0xAB): keyed Blake2b-256 + SHA256 double-hash
   */
  get signablePayloads(): Buffer[] {
    if (this._txData.inputs.length === 0) {
      throw new Error('Cannot compute signablePayloads: no inputs');
    }
    return this._txData.inputs.map((input, i) =>
      isEcdsaInput(input)
        ? computeKaspaEcdsaSigningHash(this._txData, i, SIGHASH_ALL)
        : computeKaspaSigningHash(this._txData, i, SIGHASH_ALL)
    );
  }

  /**
   * Apply a signature to a single specific input.
   *
   * Used in the multi-input MPCv2 flow where each input is signed by an
   * independent DKLS session that commits to that input's sighash. Call this
   * once per input with the signature produced for that input's signablePayloads[i].
   *
   * @param index      0-based index of the input to sign
   * @param publicKey  compressed secp256k1 public key (33 bytes hex) — not used in
   *                   the scriptSig bytes but kept for symmetry with addSignature
   * @param signature  64-byte signature buffer for input[index]
   * @param sigHashType SigHash type (default: SIGHASH_ALL)
   */
  addSignatureForInput(index: number, publicKey: string, signature: Buffer, sigHashType: number = SIGHASH_ALL): void {
    if (index < 0 || index >= this._txData.inputs.length) {
      throw new Error(`Input index ${index} is out of range (tx has ${this._txData.inputs.length} inputs)`);
    }
    if (signature.length !== 64) {
      throw new Error(`Expected 64-byte signature, got ${signature.length}`);
    }
    // Kaspa script engine requires push-only signatureScripts.
    // 0x41 = OP_DATA_65: push the next 65 bytes (64-byte sig + 1-byte sighash type) onto the stack.
    const sigWithType = Buffer.concat([Buffer.from([0x41]), signature, Buffer.from([sigHashType])]);
    this._txData.inputs[index].signatureScript = sigWithType.toString('hex');
  }

  /**
   * Sign all inputs with the given private key.
   *
   * Automatically selects the signature algorithm per input by inspecting each
   * input's scriptPublicKey:
   *   - Schnorr (last opcode 0xAC, v0 address): BIP-340 Schnorr + Blake2b sighash
   *   - ECDSA   (last opcode 0xAB, v1 address): secp256k1 ECDSA + Blake2b+SHA256 sighash
   *
   * A single transaction may mix both address types and each input will be
   * signed correctly without any extra parameters.
   *
   * @param privateKey  32-byte private key buffer
   * @param sigHashType SigHash type (default: SIGHASH_ALL = 0x01)
   */
  sign(privateKey: Buffer, sigHashType: number = SIGHASH_ALL): void {
    if (privateKey.length !== 32) {
      throw new Error(`Expected 32-byte private key, got ${privateKey.length}`);
    }
    for (let i = 0; i < this._txData.inputs.length; i++) {
      const input = this._txData.inputs[i];
      let sig: Uint8Array;
      let sigHash: Buffer;

      if (isEcdsaInput(input)) {
        // v1 ECDSA address: double-hash + compact secp256k1 ECDSA signature
        sigHash = computeKaspaEcdsaSigningHash(this._txData, i, sigHashType);
        sig = ecc.sign(sigHash, privateKey);
      } else {
        // v0 Schnorr address (default): Blake2b sighash + BIP-340 Schnorr signature
        sigHash = computeKaspaSigningHash(this._txData, i, sigHashType);
        sig = ecc.signSchnorr(sigHash, privateKey);
      }
      // Kaspa requires push-only signatureScripts: 0x41 (OP_DATA_65) + 64-byte sig + 1-byte sighash type
      const sigWithType = Buffer.concat([Buffer.from([0x41]), Buffer.from(sig), Buffer.from([sigHashType])]);
      this._txData.inputs[i].signatureScript = sigWithType.toString('hex');
    }
  }

  /**
   * Verify that the signature on a specific input is valid.
   *
   * Automatically selects the verification algorithm based on the input's
   * scriptPublicKey (ECDSA for 0xAB, Schnorr for 0xAC), matching `sign()`.
   *
   * @param publicKey  33-byte compressed public key (or 32-byte x-only for Schnorr)
   * @param inputIndex Index of the input to verify
   * @param sigHashType SigHash type used when signing
   */
  verifySignature(publicKey: Buffer, inputIndex: number, sigHashType: number = SIGHASH_ALL): boolean {
    const input = this._txData.inputs[inputIndex];
    if (!input?.signatureScript) {
      return false;
    }
    const sigBytes = Buffer.from(input.signatureScript, 'hex');
    // signatureScript layout: 0x41 (OP_DATA_65) + 64-byte sig + 1-byte sighash type = 66 bytes
    if (sigBytes.length < 66) {
      return false;
    }
    const sig = sigBytes.slice(1, 65); // skip the 0x41 push opcode

    if (isEcdsaInput(input)) {
      const sigHash = computeKaspaEcdsaSigningHash(this._txData, inputIndex, sigHashType);
      // ECDSA verification requires 33-byte compressed public key
      const compressedPub = publicKey.length === 33 ? publicKey : Buffer.concat([Buffer.from([0x02]), publicKey]);
      return ecc.verify(sigHash, compressedPub, sig);
    } else {
      const sigHash = computeKaspaSigningHash(this._txData, inputIndex, sigHashType);
      // Schnorr verification uses x-only (32-byte) public key
      const xOnlyPub = publicKey.length === 33 ? publicKey.slice(1) : publicKey;
      return ecc.verifySchnorr(sigHash, xOnlyPub, sig);
    }
  }

  /**
   * Explain the transaction in a human-readable format.
   */
  explainTransaction(): TransactionExplanation {
    let totalIn = BigInt(0);
    let totalOut = BigInt(0);

    for (const input of this._txData.inputs) {
      totalIn += BigInt(input.amount);
    }
    for (const output of this._txData.outputs) {
      totalOut += BigInt(output.amount);
    }

    const fee = (totalIn - totalOut).toString();

    const outputs = this._txData.outputs.map((o) => ({
      address: o.address,
      amount: o.amount,
    }));

    return {
      id: this._txData.id || '',
      type: TransactionType.Send,
      outputs,
      outputAmount: totalOut.toString(),
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: this._txData.fee || fee },
      inputs: this._txData.inputs,
    };
  }

  /**
   * Serialize the transaction to the Kaspa REST API JSON string.
   *
   * This is the wire format accepted by the Kaspa node REST API for broadcasting.
   * Unsigned transactions (signatureScript = "") use this same structure; once
   * all inputs are signed the same format is submitted to the node.
   *
   * Note: inputs in this format carry only `previousOutpoint`, `signatureScript`,
   * `sequence`, and `sigOpCount`. The `amount` and `scriptPublicKey` fields needed
   * for sighash computation are NOT present here — they live in `toJson()`.
   */
  toBroadcastFormat(): string {
    return JSON.stringify({
      version: this._txData.version,
      inputs: this._txData.inputs.map((input) => ({
        previousOutpoint: {
          transactionId: input.transactionId,
          index: input.transactionIndex,
        },
        signatureScript: input.signatureScript || '',
        sequence: Number(input.sequence ?? 0),
        sigOpCount: input.sigOpCount ?? 1,
      })),
      outputs: this._txData.outputs.map((output) => ({
        amount: Number(output.amount),
        scriptPublicKey: {
          version: 0,
          scriptPublicKey: output.scriptPublicKey || '',
        },
      })),
      lockTime: Number(this._txData.lockTime ?? 0),
      subnetworkId: this._txData.subnetworkId ?? '0000000000000000000000000000000000000000',
      gas: 0,
      payload: this._txData.payload ?? '',
    });
  }

  /**
   * Serialize transaction to hex using the internal `KaspaTransactionData` format.
   *
   * This hex is used for SDK-internal round-trips (builder serialisation / deserialisation)
   * because the internal format preserves `amount` and `scriptPublicKey` on inputs,
   * which are required for sighash computation but are not present in the REST API format.
   *
   * Use `Buffer.from(tx.toBroadcastFormat()).toString('hex')` when you need the hex
   * representation of the broadcast / HSM wire format.
   */
  toHex(): string {
    return Buffer.from(JSON.stringify(this._txData)).toString('hex');
  }

  /**
   * Return transaction data as a plain object.
   */
  toJson(): KaspaTransactionData {
    return { ...this._txData };
  }

  /**
   * Deserialize from hex.
   */
  static fromHex(coin: string, hex: string): Transaction {
    const json = JSON.parse(Buffer.from(hex, 'hex').toString());
    return new Transaction(coin, json);
  }

  /**
   * Deserialize from JSON string or object.
   */
  static fromJson(coin: string, data: string | KaspaTransactionData): Transaction {
    const txData: KaspaTransactionData = typeof data === 'string' ? JSON.parse(data) : data;
    return new Transaction(coin, txData);
  }

  /** @inheritDoc */
  get signature(): string[] {
    return this._txData.inputs.map((i) => i.signatureScript || '');
  }

  /** @inheritDoc */
  canSign(_key: BaseKey): boolean {
    return true;
  }

  /**
   * Convert this transaction to a PSKT in SIGNER role.
   *
   * The PSKT is populated with UTXO data from each input so that sighash
   * computation is possible immediately. Any existing `signatureScript` on an
   * input is carried into the PSKT as `finalScriptSig`.
   *
   * Typical use:
   * ```ts
   * const pskt = tx.toPskt()
   *   .sign(privateKey)
   *   .toFinalizer()
   *   .finalize()
   *   .toExtractor();
   * const broadcastJson = pskt.extract();
   * ```
   */
  toPskt(): Pskt {
    return Pskt.fromTxData(this._txData);
  }

  /**
   * Reconstruct a Transaction from a PSKT (any role).
   *
   * `finalScriptSig` from each PSKT input is mapped to `signatureScript` so
   * that the resulting transaction is signed if the PSKT has been finalised.
   *
   * @param coin  Coin name string (e.g. 'kaspa', 'tkaspa')
   * @param pskt  A Pskt instance (typically at FINALIZER or EXTRACTOR role)
   */
  static fromPskt(coin: string, pskt: Pskt): Transaction {
    return new Transaction(coin, pskt.toTxData());
  }
}
