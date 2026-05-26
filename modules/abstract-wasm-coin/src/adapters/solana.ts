/**
 * Solana WASM adapter for abstract-wasm-coin.
 *
 * Wraps @bitgo/wasm-solana and exposes:
 *   - parseTransaction  — decodes a base64-encoded transaction into normalized outputs/inputs
 *   - buildTransaction  — not yet implemented (wasm-solana building is handled inside sdk-coin-sol)
 *
 * Explain logic, fee policy, token naming, and product semantics deliberately
 * stay in sdk-coin-sol. This adapter is a thin translation layer only.
 */
import { Transaction, parseTransaction } from '@bitgo/wasm-solana';
import type { WasmCoinAdapter, WasmCoinCapability, WasmParsedTransaction } from '../types';

// =============================================================================
// Adapter-specific param/result types
// =============================================================================

export interface SolanaParseParams {
  /** Base64-encoded transaction bytes. */
  txBase64: string;
}

export interface SolanaParsedTransaction extends WasmParsedTransaction {
  raw: ReturnType<typeof parseTransaction>;
}

// =============================================================================
// Adapter implementation
// =============================================================================

export const solanaAdapter: WasmCoinAdapter<never, never, SolanaParseParams, SolanaParsedTransaction> = {
  coin: 'sol',
  capabilities: new Set<WasmCoinCapability>(['parseTransaction']),

  parseTransaction(params: SolanaParseParams): SolanaParsedTransaction {
    const txBytes = Buffer.from(params.txBase64, 'base64');
    const tx = Transaction.fromBytes(txBytes);
    const parsed = parseTransaction(tx);

    // Extract normalized outputs (Transfer instructions only — explain logic stays in sdk-coin-sol)
    const outputs: Array<{ address: string; amount: string }> = [];
    const inputs: Array<{ address: string; amount: string }> = [];

    for (const instr of parsed.instructionsData) {
      switch (instr.type) {
        case 'Transfer':
          outputs.push({ address: instr.toAddress, amount: String(instr.amount) });
          inputs.push({ address: instr.fromAddress, amount: String(instr.amount) });
          break;
        case 'TokenTransfer':
          outputs.push({ address: instr.toAddress, amount: String(instr.amount) });
          inputs.push({ address: instr.fromAddress, amount: String(instr.amount) });
          break;
      }
    }

    // Transaction ID: first signature, undefined when unsigned (all-zeros base58)
    const ALL_ZEROS = '1111111111111111111111111111111111111111111111111111111111111111';
    const sig = parsed.signatures[0];
    const id = sig && sig !== ALL_ZEROS ? sig : undefined;

    return { id, inputs, outputs, raw: parsed };
  },
};
