/**
 * Interfaces for Proton (XPR Network)
 */

import { TransactionExplanation as BaseTransactionExplanation, TransactionType } from '@bitgo/sdk-core';

/**
 * Authorization for an EOSIO action
 */
export interface Authorization {
  actor: string;
  permission: string;
}

/**
 * Transfer action data
 */
export interface TransferActionData {
  from: string;
  to: string;
  quantity: string;
  memo: string;
}

/**
 * EOSIO action
 */
export interface Action {
  account: string;
  name: string;
  authorization: Authorization[];
  data: TransferActionData | Record<string, unknown>;
}

/**
 * Transaction headers from the blockchain
 */
export interface TransactionHeaders {
  expiration: string;
  refBlockNum: number;
  refBlockPrefix: number;
}

/**
 * Transaction data structure
 */
export interface TxData {
  id?: string;
  type?: TransactionType;
  sender: string;
  expiration: string;
  refBlockNum: number;
  refBlockPrefix: number;
  actions: Action[];
  signatures: string[];
}

/**
 * Transaction JSON representation for serialization
 */
export interface TransactionJson {
  expiration: string;
  ref_block_num: number;
  ref_block_prefix: number;
  max_net_usage_words: number;
  max_cpu_usage_ms: number;
  delay_sec: number;
  context_free_actions: Action[];
  actions: Action[];
  transaction_extensions: unknown[];
}

/**
 * Broadcast format for Proton transactions
 */
export interface BroadcastFormat {
  signatures: string[];
  compression: string;
  packed_context_free_data: string;
  packed_trx: string;
}

/**
 * Transaction output (recipient)
 */
export interface TransactionOutput {
  address: string;
  amount: string;
  memo?: string;
}

/**
 * Transaction input (sender)
 */
export interface TransactionInput {
  address: string;
  amount: string;
}

/**
 * Extended transaction explanation for Proton
 */
export interface TransactionExplanation extends BaseTransactionExplanation {
  type: string;
  sender?: string;
  memo?: string;
}
