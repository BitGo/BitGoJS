/**
 * Demo: TON WASM adapter registration and usage.
 *
 * Shows both primitives (address derivation + transaction parsing) through
 * the same adapter interface as Solana and Polkadot.
 */
import { defaultRegistry } from '../registry';
import { tonAdapter } from '../adapters/ton';

defaultRegistry.register(tonAdapter);

export async function normalizeTonAddress(address: string, bounceable = true) {
  const adapter = defaultRegistry.get('ton');
  return adapter.deriveAddress!({ address, bounceable });
}

export async function parseTonTransaction(txBase64: string, toAddressBounceable = true) {
  const adapter = defaultRegistry.get('ton');
  return adapter.parseTransaction!({ txBase64, toAddressBounceable });
}
