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
import { SolVersionedTransactionData, TransactionType } from '@bitgo/sdk-core';
import { buildUnsignedTransaction } from '../wasmTransactionBuilder';
import { WasmTransaction } from './transaction';
import { KeyPair } from '../keyPair';
import { DurableNonceParams, InstructionParams } from '../iface';

// Import program IDs from WASM to avoid @solana/web3.js dependency
import { systemProgramId, sysvarRecentBlockhashes } from '@bitgo/wasm-solana';

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

  // Round-trip path: if we have a parsed transaction, add signatures directly
  // without rebuilding. This handles all cases including VersionedCustomInstruction
  // which cannot be rebuilt (indexes can't be resolved without ALT data).
  if (parsedTransaction) {
    // TODO(BTC-2955): Remove this shim call when legacy Transaction class is deleted
    if (transactionType !== TransactionType.StakingAuthorizeRaw) {
      parsedTransaction.filterNonceAdvanceFromInstructions();
    }
    parsedTransaction.lamportsPerSignature = lamportsPerSignature;
    parsedTransaction.tokenAccountRentExemptAmount = tokenAccountRentExemptAmount;

    // Sign with provided signers
    for (const signer of signers) {
      await parsedTransaction.sign(signer);
    }

    // Add pre-computed signatures
    for (const sig of signatures) {
      parsedTransaction.addSignature(sig.publicKey, sig.signature);
    }

    return parsedTransaction;
  }

  // New transaction path: build from scratch using WASM
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

/**
 * Parameters for building a versioned WASM transaction from raw MessageV0 data.
 */
export interface VersionedWasmBuildParams {
  /** Coin configuration */
  coinConfig: Readonly<CoinConfig>;
  /** Versioned transaction data (staticAccountKeys, ALTs, instructions, etc.) */
  versionedData: SolVersionedTransactionData;
  /** Recent blockhash (overrides versionedData.recentBlockhash if provided) */
  recentBlockhash?: string;
  /** Durable nonce params if using durable nonce */
  durableNonceParams?: DurableNonceParams;
  /** Transaction type for the resulting transaction */
  transactionType: TransactionType;
  /** Instruction params for metadata */
  instructionsData: InstructionParams[];
  /** Signers to sign the transaction with */
  signers?: KeyPair[];
  /** Pre-computed signatures to add */
  signatures?: Array<{ publicKey: string; signature: Buffer }>;
  /** Lamports per signature (fee info) */
  lamportsPerSignature?: number;
  /** Token account rent exempt amount */
  tokenAccountRentExemptAmount?: string;
}

/**
 * Build a versioned WASM transaction from raw MessageV0 data.
 *
 * This handles the fromVersionedTransactionData() path where we have pre-compiled
 * versioned data (indexes + ALT refs). Uses WasmTransaction.fromVersionedData()
 * to build without @solana/web3.js dependency.
 *
 * @param params - Build parameters
 * @returns A signed WasmTransaction
 */
export async function buildVersionedWasmTransaction(params: VersionedWasmBuildParams): Promise<WasmTransaction> {
  const {
    coinConfig,
    versionedData,
    recentBlockhash: overrideBlockhash,
    durableNonceParams,
    transactionType,
    instructionsData,
    signers = [],
    signatures = [],
    lamportsPerSignature,
    tokenAccountRentExemptAmount,
  } = params;

  // Inject nonce advance instruction if durable nonce params are set
  let processedData = versionedData;
  if (durableNonceParams) {
    processedData = injectNonceAdvanceInstruction(versionedData, durableNonceParams);
  }

  // Use override blockhash or from versioned data
  const recentBlockhash = overrideBlockhash || processedData.recentBlockhash;
  if (!recentBlockhash) {
    throw new Error('recent blockhash is required');
  }

  // Build WasmTransaction from raw versioned data
  const wasmTx = new WasmTransaction(coinConfig);
  wasmTx.fromVersionedData(
    {
      staticAccountKeys: processedData.staticAccountKeys,
      addressLookupTables: processedData.addressLookupTables,
      versionedInstructions: processedData.versionedInstructions,
      messageHeader: processedData.messageHeader,
      recentBlockhash,
    },
    transactionType,
    instructionsData
  );

  wasmTx.lamportsPerSignature = lamportsPerSignature;
  wasmTx.tokenAccountRentExemptAmount = tokenAccountRentExemptAmount;

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
 * Inject nonce advance instruction into versioned transaction data.
 * Pure WASM path - no @solana/web3.js dependency.
 *
 * @param data - Original versioned transaction data
 * @param durableNonceParams - Nonce account and authority addresses
 * @returns Modified versioned transaction data with nonce advance instruction prepended
 */
export function injectNonceAdvanceInstruction(
  data: SolVersionedTransactionData,
  durableNonceParams: DurableNonceParams
): SolVersionedTransactionData {
  const { walletNonceAddress, authWalletAddress } = durableNonceParams;

  // Get program IDs from WASM (they're functions that return strings)
  const SYSTEM_PROGRAM = systemProgramId();
  const SYSVAR_RECENT_BLOCKHASHES = sysvarRecentBlockhashes();

  const numSigners = data.messageHeader.numRequiredSignatures;
  const originalSigners = data.staticAccountKeys.slice(0, numSigners);
  const originalNonSigners = data.staticAccountKeys.slice(numSigners);

  // Add nonce authority as signer if not already present
  if (!originalSigners.includes(authWalletAddress)) {
    originalSigners.push(authWalletAddress);
  }

  const nonSigners = [...originalNonSigners];
  const allKeys = [...originalSigners, ...originalNonSigners];

  // Add required accounts for nonce advance if not present
  if (!allKeys.includes(SYSTEM_PROGRAM)) nonSigners.push(SYSTEM_PROGRAM);
  if (!allKeys.includes(walletNonceAddress)) nonSigners.push(walletNonceAddress);
  if (!allKeys.includes(SYSVAR_RECENT_BLOCKHASHES)) nonSigners.push(SYSVAR_RECENT_BLOCKHASHES);

  const newStaticAccountKeys = [...originalSigners, ...nonSigners];

  // Create nonce advance instruction
  // Instruction data: [4, 0, 0, 0] = discriminator 4 (AdvanceNonceAccount) in little-endian
  // Base58 encoded: '6vx8P'
  // Reference: https://github.com/solana-labs/solana/blob/v1.18.26/sdk/program/src/system_instruction.rs#L164
  const nonceAdvanceInstruction = {
    programIdIndex: newStaticAccountKeys.indexOf(SYSTEM_PROGRAM),
    accountKeyIndexes: [
      newStaticAccountKeys.indexOf(walletNonceAddress),
      newStaticAccountKeys.indexOf(SYSVAR_RECENT_BLOCKHASHES),
      newStaticAccountKeys.indexOf(authWalletAddress),
    ],
    data: '6vx8P',
  };

  // Remap original instruction indices to new account positions
  const indexMap = new Map(data.staticAccountKeys.map((key, oldIdx) => [oldIdx, newStaticAccountKeys.indexOf(key)]));
  const remappedInstructions = data.versionedInstructions.map((inst) => ({
    programIdIndex: indexMap.get(inst.programIdIndex) ?? inst.programIdIndex,
    accountKeyIndexes: inst.accountKeyIndexes.map((idx: number) => indexMap.get(idx) ?? idx),
    data: inst.data,
  }));

  return {
    ...data,
    versionedInstructions: [nonceAdvanceInstruction, ...remappedInstructions],
    staticAccountKeys: newStaticAccountKeys,
    messageHeader: {
      ...data.messageHeader,
      numRequiredSignatures: originalSigners.length,
    },
  };
}
