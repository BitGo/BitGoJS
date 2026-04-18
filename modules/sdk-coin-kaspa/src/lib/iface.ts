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
 * Kaspa sign transaction options
 */
export interface KaspaSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

/**
 * Kaspa transaction params
 */
export interface KaspaTransactionParams extends TransactionParams {
  type?: string;
  unspents?: KaspaUtxoInput[];
}

/**
 * Kaspa explain transaction options
 */
export interface KaspaExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
}

/**
 * Kaspa verify transaction options
 */
export interface KaspaVerifyTransactionOptions extends VerifyTransactionOptions {
  txParams: KaspaTransactionParams;
}

/**
 * Kaspa transaction fee info
 */
export interface KaspaTransactionFee {
  fee: string;
}
