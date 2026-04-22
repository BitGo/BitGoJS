import { BaseKey, BaseTransaction, TransactionType } from '@bitgo/sdk-core';
import { ecc } from '@bitgo/secp256k1';
import { KaspaTransactionData, TransactionExplanation } from './iface';
import { computeKaspaSigningHash, SIGHASH_ALL } from './sighash';

export class Transaction extends BaseTransaction {
  protected _txData: KaspaTransactionData;

  constructor(coin: string, txData?: KaspaTransactionData) {
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
   * Sign all inputs with the given private key using Schnorr signatures.
   *
   * @param privateKey 32-byte private key buffer
   * @param sigHashType SigHash type (default: SIGHASH_ALL = 0x01)
   */
  sign(privateKey: Buffer, sigHashType: number = SIGHASH_ALL): void {
    if (privateKey.length !== 32) {
      throw new Error(`Expected 32-byte private key, got ${privateKey.length}`);
    }
    for (let i = 0; i < this._txData.inputs.length; i++) {
      const sigHash = computeKaspaSigningHash(this._txData, i, sigHashType);
      const sig = ecc.signSchnorr(sigHash, privateKey);
      // 65-byte signature: 64-byte Schnorr sig + 1-byte sighash type
      const sigWithType = Buffer.concat([Buffer.from(sig), Buffer.from([sigHashType])]);
      this._txData.inputs[i].signatureScript = sigWithType.toString('hex');
    }
  }

  /**
   * Verify that a Schnorr signature on a specific input is valid.
   *
   * @param publicKey 33-byte compressed public key (or 32-byte x-only)
   * @param inputIndex Index of the input to verify
   * @param sigHashType SigHash type used when signing
   */
  verifySignature(publicKey: Buffer, inputIndex: number, sigHashType: number = SIGHASH_ALL): boolean {
    const input = this._txData.inputs[inputIndex];
    if (!input?.signatureScript) {
      return false;
    }
    const sigBytes = Buffer.from(input.signatureScript, 'hex');
    if (sigBytes.length < 65) {
      return false;
    }
    const sig = sigBytes.slice(0, 64);
    const sigHash = computeKaspaSigningHash(this._txData, inputIndex, sigHashType);
    // Accept 33-byte compressed or 32-byte x-only
    const xOnlyPub = publicKey.length === 33 ? publicKey.slice(1) : publicKey;
    return ecc.verifySchnorr(sigHash, xOnlyPub, sig);
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
   * Serialize the transaction to a JSON string (broadcast format).
   */
  toBroadcastFormat(): string {
    return JSON.stringify(this._txData);
  }

  /**
   * Serialize transaction to hex (JSON-encoded then hex-encoded).
   */
  toHex(): string {
    return Buffer.from(this.toBroadcastFormat()).toString('hex');
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
}
