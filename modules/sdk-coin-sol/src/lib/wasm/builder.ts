/**
 * Clean WASM transaction builder - The grug approach.
 *
 * This module contains ALL WASM building logic. The main TransactionBuilder
 * should just call these functions - no WASM code should leak into the legacy builder.
 *
 * Why this exists:
 * - One place for all WASM building logic
 * - Easy to delete legacy code later (just remove the fallback)
 * - Clean separation = happy grug
 *
 * Usage:
 * - buildWasmTransaction() builds and optionally signs a transaction
 * - parseWasmTransaction() parses a raw transaction
 */

import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { buildUnsignedTransaction } from '../wasmTransactionBuilder';
import { WasmTransaction } from './transaction';
import { KeyPair } from '../keyPair';
import { DurableNonceParams, InstructionParams } from '../iface';

/**
 * Parameters for building a WASM transaction.
 */
export interface WasmBuildParams {
  /** Coin configuration */
  coinConfig: Readonly<CoinConfig>;
  /** Fee payer address */
  feePayer: string;
  /** Recent blockhash or nonce value */
  recentBlockhash: string;
  /** Durable nonce params if using durable nonce */
  durableNonceParams?: DurableNonceParams;
  /** Instructions to include in the transaction */
  instructionsData: InstructionParams[];
  /** Transaction type for the resulting transaction */
  transactionType: TransactionType;
  /** Signers to sign the transaction with */
  signers?: KeyPair[];
  /** Pre-computed signatures to add */
  signatures?: Array<{ publicKey: string; signature: Buffer }>;
  /** Lamports per signature (fee info) */
  lamportsPerSignature?: number;
  /** Token account rent exempt amount */
  tokenAccountRentExemptAmount?: string;
  /** Previously parsed transaction (for round-trips) */
  parsedTransaction?: WasmTransaction;
  /** Address lookup tables for versioned transactions */
  addressLookupTables?: Array<{ accountKey: string; writableIndexes: number[]; readonlyIndexes: number[] }>;
  /** Static account keys for versioned transactions */
  staticAccountKeys?: string[];
}

/**
 * Build a WASM transaction from instruction params.
 *
 * This is the ONLY function you need for WASM building. It:
 * 1. Builds unsigned transaction bytes using WASM
 * 2. Creates a WasmTransaction
 * 3. Signs with provided signers
 * 4. Adds pre-computed signatures
 *
 * @param params - Build parameters
 * @returns A signed WasmTransaction
 */
export async function buildWasmTransaction(params: WasmBuildParams): Promise<WasmTransaction> {
  const {
    coinConfig,
    feePayer,
    recentBlockhash,
    durableNonceParams,
    instructionsData,
    transactionType,
    signers = [],
    signatures = [],
    lamportsPerSignature,
    tokenAccountRentExemptAmount,
    parsedTransaction,
    addressLookupTables,
    staticAccountKeys,
  } = params;

  // Round-trip optimization: if no modifications, return parsed tx directly
  const hasNoModifications = signers.length === 0 && signatures.length === 0;
  if (parsedTransaction && hasNoModifications) {
    // TODO(BTC-2955): Remove this shim call when legacy Transaction class is deleted
    if (transactionType !== TransactionType.StakingAuthorizeRaw) {
      parsedTransaction.filterNonceAdvanceFromInstructions();
    }
    parsedTransaction.lamportsPerSignature = lamportsPerSignature;
    parsedTransaction.tokenAccountRentExemptAmount = tokenAccountRentExemptAmount;
    return parsedTransaction;
  }

  // Build unsigned transaction bytes
  const txBytes = buildUnsignedTransaction({
    feePayer,
    recentBlockhash,
    durableNonceParams,
    instructionsData,
    addressLookupTables,
    staticAccountKeys,
  });

  // Create WasmTransaction from bytes
  const wasmTx = new WasmTransaction(coinConfig);
  wasmTx.fromBuiltBytes(txBytes, transactionType, instructionsData);
  wasmTx.lamportsPerSignature = lamportsPerSignature;
  wasmTx.tokenAccountRentExemptAmount = tokenAccountRentExemptAmount;

  // TODO(BTC-2955): Remove this shim call when legacy Transaction class is deleted
  wasmTx.filterRentFundingTransferForPartialDeactivate();

  // Preserve signatures from parsed transaction (round-trip with modifications)
  if (parsedTransaction) {
    const signaturesWithKeys = parsedTransaction.getSignaturesWithPublicKeys();
    for (const { publicKey, signature } of signaturesWithKeys) {
      wasmTx.addSignature(publicKey, signature);
    }
  }

  // Sign with provided signers
  for (const signer of signers) {
    await wasmTx.sign(signer);
  }

  // Add pre-computed signatures
  for (const sig of signatures) {
    wasmTx.addSignature(sig.publicKey, sig.signature);
  }

  return wasmTx;
}

/**
 * Parse a raw transaction using WASM.
 *
 * @param rawTransaction - Base64 encoded transaction
 * @param coinConfig - Coin configuration
 * @returns Parsed WasmTransaction
 */
export function parseWasmTransaction(rawTransaction: string, coinConfig: Readonly<CoinConfig>): WasmTransaction {
  const tx = new WasmTransaction(coinConfig);
  tx.fromRawTransaction(rawTransaction);
  return tx;
}
