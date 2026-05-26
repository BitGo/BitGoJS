/**
 * Demo: Solana WASM adapter usage through the abstract-wasm-coin registry.
 *
 * Shows that BitGoJS code can call the same entry point regardless of chain:
 *   registry.get('sol').parseTransaction(...)
 */
import { defaultRegistry } from '../registry';
import { solanaAdapter } from '../adapters/solana';

// Register the adapter once at startup
defaultRegistry.register(solanaAdapter);

export async function parseSolanaTransaction(txBase64: string) {
  const wasm = defaultRegistry.get('sol');
  return wasm.parseTransaction({ txBase64 });
}
