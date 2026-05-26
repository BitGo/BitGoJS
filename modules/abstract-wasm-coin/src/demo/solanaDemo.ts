/**
 * Demo: Solana adapter registration and usage.
 *
 * Shows how a concrete WasmSol coin class would obtain its adapter via the
 * registry and call the WASM primitive directly. The adapter is injected
 * into AbstractWasmCoin via the constructor, making it available as
 * `this.wasmAdapter` in every method of the coin class.
 *
 *   class Sol extends AbstractWasmCoin {
 *     constructor(bitgo: BitGoBase) {
 *       super(bitgo, defaultRegistry.get('sol'));
 *     }
 *     // ... coin-specific methods use this.wasmAdapter
 *   }
 */
import { defaultRegistry } from '../registry';
import { solanaAdapter } from '../adapters/solana';

// Register the adapter once at startup (called from the sdk-coin-sol package init)
defaultRegistry.register(solanaAdapter);

export async function parseSolanaTransaction(txBase64: string) {
  const adapter = defaultRegistry.get('sol');
  return adapter.parseTransaction!({ txBase64 });
}
