/**
 * Demo: Polkadot WASM adapter usage through the abstract-wasm-coin registry.
 */
import type { Material } from '@bitgo/wasm-dot';
import { defaultRegistry } from '../registry';
import { dotAdapter } from '../adapters/dot';

defaultRegistry.register(dotAdapter);

export async function parseDotTransaction(txHex: string, material: Material, senderAddress?: string) {
  const wasm = defaultRegistry.get('dot');
  return wasm.parseTransaction({ txHex, material, senderAddress });
}
