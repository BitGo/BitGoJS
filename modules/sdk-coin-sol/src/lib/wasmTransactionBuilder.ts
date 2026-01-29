/**
 * Clean WASM-based transaction builder utility.
 *
 * This module provides a simple function to build unsigned Solana transactions
 * using @bitgo/wasm-solana. It's separate from the SDK's TransactionBuilder
 * and can be composed into workflows as needed.
 *
 * Usage:
 * - Build unsigned transaction bytes from instruction params
 * - Returns Uint8Array that can be signed and broadcast
 * - No dependencies on @solana/web3.js for building
 */

import { buildTransaction as wasmBuildTransaction } from '@bitgo/wasm-solana';
import { mapToTransactionIntent, IntentMapperParams } from './wasmIntentMapper';

/**
 * Build an unsigned Solana transaction using WASM.
 *
 * This function takes high-level instruction params and produces
 * unsigned transaction bytes via the WASM builder.
 *
 * @param params - The transaction parameters (feePayer, blockhash, instructions)
 * @returns Unsigned transaction bytes (Uint8Array)
 *
 * @example
 * ```typescript
 * const txBytes = buildUnsignedTransaction({
 *   feePayer: senderAddress,
 *   recentBlockhash: blockhash,
 *   instructionsData: [
 *     { type: 'Transfer', params: { fromAddress: sender, toAddress: recipient, amount: '1000000' } }
 *   ],
 * });
 * ```
 */
export function buildUnsignedTransaction(params: IntentMapperParams): Uint8Array {
  const intent = mapToTransactionIntent(params);
  return wasmBuildTransaction(intent).toBytes();
}
