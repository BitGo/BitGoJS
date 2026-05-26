/**
 * Demo: TON WASM adapter usage through the abstract-wasm-coin registry.
 *
 * Shows both primitives: address normalization and transaction parsing,
 * called through the same uniform interface as Solana and Polkadot.
 */
import { defaultRegistry } from '../registry';
import { tonAdapter } from '../adapters/ton';

defaultRegistry.register(tonAdapter);

export async function normalizeTonAddress(address: string, bounceable = true) {
  const wasm = defaultRegistry.get('ton');
  return wasm.deriveAddress({ address, bounceable });
}

export async function parseTonTransaction(txBase64: string, toAddressBounceable = true) {
  const wasm = defaultRegistry.get('ton');
  return wasm.parseTransaction({ txBase64, toAddressBounceable });
}
