import type { WasmCoinAdapter } from './types';
import { AbstractWasmCoin } from './abstractWasmCoin';

/**
 * Registry for WASM coin adapters.
 *
 * Each per-coin WASM adapter registers itself once (typically at module init).
 * Consumers call `get(coin)` to obtain an AbstractWasmCoin instance.
 *
 * Usage:
 *   registry.register(solanaAdapter);
 *   const wasm = registry.get('sol');
 *   const parsed = await wasm.parseTransaction({ txBase64: '...' });
 */
export class WasmCoinRegistry {
  private readonly adapters = new Map<string, WasmCoinAdapter>();

  register(adapter: WasmCoinAdapter): void {
    this.adapters.set(adapter.coin, adapter);
  }

  /**
   * Returns an AbstractWasmCoin for the given coin identifier.
   * Throws if no adapter has been registered for that coin.
   */
  get(coin: string): AbstractWasmCoin {
    const adapter = this.adapters.get(coin);
    if (!adapter) {
      throw new Error(`No WASM adapter registered for coin: ${coin}`);
    }
    return new AbstractWasmCoin(adapter);
  }

  has(coin: string): boolean {
    return this.adapters.has(coin);
  }

  registeredCoins(): string[] {
    return Array.from(this.adapters.keys());
  }
}

/** Module-level default registry. Adapters call `defaultRegistry.register(...)` on import. */
export const defaultRegistry = new WasmCoinRegistry();
