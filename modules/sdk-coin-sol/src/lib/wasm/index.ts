/**
 * WASM-only implementations for Solana.
 *
 * These implementations use @bitgo/wasm-solana exclusively,
 * with zero @solana/web3.js dependencies.
 *
 * Exports:
 * - WasmTransaction: Transaction class for parsing and serialization
 * - buildWasmTransaction: Build and sign transactions using WASM
 * - parseWasmTransaction: Parse raw transactions using WASM
 */
export { WasmTransaction } from './transaction';
export { buildWasmTransaction, parseWasmTransaction } from './builder';
export type { WasmBuildParams } from './builder';
