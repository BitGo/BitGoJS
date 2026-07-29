import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionPrebuild as BaseTransactionPrebuild,
  SignTransactionOptions,
  TransactionParams,
  TransactionRecipient,
  TransactionType,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';

/**
 * Kaspa UTXO input (reference to a previous transaction output)
 */
export interface KaspaUtxoInput {
  /** Previous transaction ID (hex string) */
  transactionId: string;
  /** Output index in the previous transaction */
  transactionIndex: number;
  /** Amount in sompi */
  amount: string;
  /** Script public key of the UTXO */
  scriptPublicKey: string;
  /** Sequence number */
  sequence?: string;
  /** Signature operation count */
  sigOpCount?: number;
  /** Signature script — hex-encoded (65 bytes: 64-byte Schnorr sig + 1-byte sighash type) */
  signatureScript?: string;
}

/**
 * Kaspa transaction output
 */
export interface KaspaTransactionOutput {
  /** Recipient address */
  address: string;
  /** Amount in sompi */
  amount: string;
  /** Script public key */
  scriptPublicKey?: string;
}

/**
 * Kaspa transaction data structure
 */
export interface KaspaTransactionData {
  /** Transaction version */
  version: number;
  /** Transaction inputs (UTXOs being spent) */
  inputs: KaspaUtxoInput[];
  /** Transaction outputs */
  outputs: KaspaTransactionOutput[];
  /** Lock time */
  lockTime?: string;
  /** Subnetwork ID (all-zeros for native KASPA transfers) */
  subnetworkId?: string;
  /** Transaction payload (empty for native transfers) */
  payload?: string;
  /** Fee in sompi */
  fee?: string;
  /** Transaction ID (computed) */
  id?: string;
}

/**
 * Kaspa transaction explanation for users
 */
export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
  inputs: KaspaUtxoInput[];
}

/**
 * Kaspa transaction prebuild for signing
 */
export interface TransactionPrebuild extends BaseTransactionPrebuild {
  /** Serialized transaction as hex or JSON string */
  txHex: string;
  txInfo: KaspaTxInfo;
  source: string;
}

export interface KaspaTxInfo {
  recipients: TransactionRecipient[];
  from: string;
  utxos?: KaspaUtxoInput[];
}

/**
 * A single per-input Schnorr signature produced by an external TSS session.
 * Each entry corresponds to one entry in `tx.signablePayloads`.
 */
export interface KaspaInputSignature {
  /** 0-based index of the input this signature covers */
  inputIndex: number;
  /** Hex-encoded compressed secp256k1 public key (33 bytes) */
  pubKey: string;
  /** Hex-encoded 64-byte raw Schnorr signature */
  signature: string;
}

/**
 * Kaspa sign transaction options.
 *
 * Two mutually exclusive signing modes:
 *
 * 1. `prv`        — direct private-key signing (test / non-TSS).
 *                   `tx.sign(prv)` is called, which loops all inputs.
 *
 * 2. `signatures` — TSS multi-input mode.
 *                   The caller ran one independent DKLS session per input
 *                   (over `tx.signablePayloads[i]`) and collected the
 *                   resulting Schnorr signatures. Each signature is applied
 *                   via `tx.addSignatureForInput(inputIndex, pubKey, sig)`.
 */
export interface KaspaSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  /** Direct private key — signs every input in one call */
  prv?: string;
  /** Per-input TSS signatures — one entry per input that was signed */
  signatures?: KaspaInputSignature[];
}

/**
 * Kaspa transaction params
 */
export interface KaspaTransactionParams extends TransactionParams {
  type?: string;
  unspents?: KaspaUtxoInput[];
}

/**
 * Kaspa verify transaction options
 */
export interface KaspaVerifyTransactionOptions extends VerifyTransactionOptions {
  txParams: KaspaTransactionParams;
}
