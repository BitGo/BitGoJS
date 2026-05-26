import type {
  WasmCoinAdapter,
  WasmCoinCapability,
  WasmDerivedAddress,
  WasmParsedTransaction,
  WasmBuiltTransaction,
} from './types';

/**
 * Abstract wrapper that dispatches calls to a registered WasmCoinAdapter.
 *
 * Callers use this class instead of talking to adapters directly so that:
 *   - capability checks are centralized and consistent
 *   - the registry can return a uniform type regardless of which adapter is loaded
 *   - future cross-cutting concerns (telemetry, error wrapping) have one place to live
 */
export class AbstractWasmCoin {
  constructor(private readonly adapter: WasmCoinAdapter) {}

  get coin(): string {
    return this.adapter.coin;
  }

  hasCapability(cap: WasmCoinCapability): boolean {
    return this.adapter.capabilities.has(cap);
  }

  deriveAddress(params: unknown): Promise<WasmDerivedAddress> {
    if (!this.adapter.deriveAddress) {
      throw new Error(`${this.adapter.coin}: deriveAddress is not supported`);
    }
    return Promise.resolve(this.adapter.deriveAddress(params as never));
  }

  parseTransaction(params: unknown): Promise<WasmParsedTransaction> {
    if (!this.adapter.parseTransaction) {
      throw new Error(`${this.adapter.coin}: parseTransaction is not supported`);
    }
    return Promise.resolve(this.adapter.parseTransaction(params as never));
  }

  buildTransaction(params: unknown): Promise<WasmBuiltTransaction> {
    if (!this.adapter.buildTransaction) {
      throw new Error(`${this.adapter.coin}: buildTransaction is not supported`);
    }
    return Promise.resolve(this.adapter.buildTransaction(params as never));
  }
}
