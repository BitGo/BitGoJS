/**
 * WASM Instruction Combiner
 *
 * Entry point for converting WASM-parsed transactions to BitGoJS format.
 * Uses the mapper to convert already-decoded WASM instructions.
 *
 * NO @solana/web3.js dependencies - WASM does all the decoding.
 */

import { TransactionType } from '@bitgo/sdk-core';
import { parseTransaction } from '@bitgo/wasm-solana';
import { InstructionParams } from './iface';
import { mapWasmInstructions } from './wasmInstructionMapper';

// =============================================================================
// Types
// =============================================================================

/** Result of combining WASM instructions */
export interface CombinedInstructionsResult {
  /** Combined instructions in BitGoJS format */
  instructions: InstructionParams[];
  /** Derived transaction type */
  transactionType: TransactionType;
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Parse and map WASM transaction to BitGoJS InstructionParams format.
 *
 * This function:
 * 1. Parses transaction bytes with WASM (which decodes all instructions)
 * 2. Maps the decoded instructions to BitGoJS format
 *
 * NO @solana/web3.js - WASM handles all decoding!
 *
 * @param txBytes - Raw transaction bytes
 * @returns Combined instructions and transaction type
 */
export function combineWasmInstructionsFromBytes(txBytes: Uint8Array): CombinedInstructionsResult {
  // Parse with WASM - this decodes ALL instructions
  const parsed = parseTransaction(txBytes);

  // Map to BitGoJS format
  return mapWasmInstructions(parsed);
}
