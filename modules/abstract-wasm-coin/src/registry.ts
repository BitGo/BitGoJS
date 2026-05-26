import type { WasmCoinAdapter } from './types';

/**
 * Registry for WASM coin adapters.
 *
 * Adapters are registered once (typically at module init) and looked up by
 * coin identifier. The registry is separate from the BitGoJS CoinFactory —
 * it exists only to make the per-coin WASM package pluggable.
 *
 * Usage:
 *   defaultRegistry.register(solanaAdapter);
 *   const adapter = defaultRegistry.get('sol');
 *
 * The adapter is then passed to the AbstractWasmCoin constructor:
 *   class Sol extends AbstractWasmCoin {
 *     constructor(bitgo: BitGoBase) {
 *       super(bitgo, defaultRegistry.get('sol'));
 *     }
 *   }
 */
export class WasmAdapterRegistry {
  private readonly adapters = new Map<string, WasmCoinAdapter>();

  register(adapter: WasmCoinAdapter): void {
    this.adapters.set(adapter.coin, adapter);
  }

  get(coin: string): WasmCoinAdapter {
    const adapter = this.adapters.get(coin);
    if (!adapter) {
      throw new Error(`No WASM adapter registered for coin: ${coin}`);
    }
    return adapter;
  }

  has(coin: string): boolean {
    return this.adapters.has(coin);
  }

  registeredCoins(): string[] {
    return Array.from(this.adapters.keys());
  }
}

/** Module-level default registry. Adapters call `defaultRegistry.register(...)` on import. */
export const defaultRegistry = new WasmAdapterRegistry();
