/**
 * Kaspa (KAS) Type Definitions
 *
 * Interfaces for Kaspa UTXO transactions, builders, and coin class.
 */

import { SignTransactionOptions, BaseKey } from '@bitgo/sdk-core';

// ─── UTXO Types ──────────────────────────────────────────────────────────────

/**
 * Kaspa UTXO (Unspent Transaction Output) used as a transaction input
 */
export interface KaspaUtxoEntry {
  /** Transaction ID of the transaction containing this UTXO */
  transactionId: string;
  /** Output index within the transaction */
  index: number;
  /** Amount in sompi */
  amount: bigint;
  /** Script public key */
  scriptPublicKey: KaspaScriptPublicKey;
  /** Block DAA (Difficulty Adjustment Algorithm) score when the UTXO was created */
  blockDaaScore: bigint;
  /** Whether this is a coinbase output */
  isCoinbase: boolean;
}

/**
 * Script public key (locking script)
 */
export interface KaspaScriptPublicKey {
  /** Script version (0 for P2PK) */
  version: number;
  /** Script bytes as hex string */
  script: string;
}

// ─── Transaction Types ───────────────────────────────────────────────────────

/**
 * Kaspa transaction outpoint (reference to previous UTXO)
 */
export interface KaspaOutpoint {
  /** Transaction ID (32 bytes hex) */
  transactionId: string;
  /** Output index */
  index: number;
}

/**
 * Kaspa transaction input
 */
export interface KaspaTransactionInput {
  /** Reference to previous UTXO */
  previousOutpoint: KaspaOutpoint;
  /** Signature script (populated after signing, as hex) */
  signatureScript: string;
  /** Sequence number */
  sequence: bigint;
  /** Signature operation count */
  sigOpCount: number;
}

/**
 * Kaspa transaction output
 */
export interface KaspaTransactionOutput {
  /** Amount in sompi */
  value: bigint;
  /** Locking script */
  scriptPublicKey: KaspaScriptPublicKey;
}

/**
 * Full Kaspa transaction data
 */
export interface KaspaTransactionData {
  /** Transaction version (0) */
  version: number;
  /** List of inputs */
  inputs: KaspaTransactionInput[];
  /** List of outputs */
  outputs: KaspaTransactionOutput[];
  /** Lock time (0 for standard transactions) */
  lockTime: bigint;
  /** Subnetwork ID (20 bytes; all zeros for native transactions) */
  subnetworkId: string;
  /** Gas (0 for native transactions) */
  gas: bigint;
  /** Payload (empty for native transactions) */
  payload: string;
  /** UTXO entries for each input (used for signing) */
  utxoEntries?: KaspaUtxoEntry[];
}

// ─── Coin Interface Types ─────────────────────────────────────────────────────

/**
 * Transaction prebuild data passed to signTransaction()
 */
export interface KaspaTransactionPrebuild {
  /** Serialized transaction as hex */
  txHex?: string;
  /** Optional half-signed hex */
  halfSigned?: { txHex: string };
  /** UTXO entries for all inputs — required for sighash computation during signing */
  utxoEntries?: KaspaUtxoEntry[];
}

/**
 * Parameters for signing a Kaspa transaction
 */
export interface KaspaSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: KaspaTransactionPrebuild;
  prv: string;
  pubs?: string[];
}

/**
 * Parameters for verifying a Kaspa transaction
 */
export interface KaspaVerifyTransactionOptions {
  txPrebuild: KaspaTransactionPrebuild;
  txParams: KaspaTransactionParams;
  verification?: Record<string, unknown>;
}

/**
 * Parameters for building/explaining a Kaspa transaction
 */
export interface KaspaTransactionParams {
  recipients: Array<{ address: string; amount: string }>;
  unspents?: KaspaUtxoEntry[];
  feeRate?: string;
  fee?: string;
}

/**
 * Parameters for explaining a Kaspa transaction
 */
export interface KaspaExplainTransactionOptions {
  txHex?: string;
  halfSigned?: { txHex: string };
}

/**
 * Human-readable transaction explanation
 */
export interface KaspaTransactionExplanation {
  id: string;
  /** Sender address (derived from UTXOs) */
  sender?: string;
  /** Transaction outputs */
  outputs: Array<{ address: string; amount: string }>;
  /** Total output amount in string */
  outputAmount: string;
  changeOutputs: Array<{ address: string; amount: string }>;
  changeAmount: string;
  fee: { fee: string };
  /** Transaction type */
  type: string;
}

/**
 * Key entry for UTXO wallet
 */
export interface KaspaKeyEntry extends BaseKey {
  /** Compressed public key (hex) */
  pub: string;
  /** Optional private key (hex) */
  prv?: string;
}
