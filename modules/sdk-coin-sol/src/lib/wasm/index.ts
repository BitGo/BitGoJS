/**
 * WASM-only implementations for Solana.
 *
 * These implementations use @bitgo/wasm-solana exclusively,
 * with zero @solana/web3.js dependencies.
 *
 * Exports:
 * - WasmTransaction: Transaction class for parsing and serialization
 * - buildWasmTransaction: Build and sign transactions using WASM
 * - buildVersionedWasmTransaction: Build versioned transactions from raw MessageV0 data
 * - parseWasmTransaction: Parse raw transactions using WASM
 * - injectNonceAdvanceInstruction: Inject nonce advance into versioned transaction data
 */
export { WasmTransaction } from './transaction';
export {
  buildWasmTransaction,
  buildVersionedWasmTransaction,
  parseWasmTransaction,
  injectNonceAdvanceInstruction,
} from './builder';
export type { WasmBuildParams, VersionedWasmBuildParams } from './builder';
