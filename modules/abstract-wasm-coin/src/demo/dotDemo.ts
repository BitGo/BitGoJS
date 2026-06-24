/**
 * Demo: Polkadot WASM adapter registration and usage.
 */
import type { Material } from '@bitgo/wasm-dot';
import { defaultRegistry } from '../registry';
import { dotAdapter } from '../adapters/dot';

defaultRegistry.register(dotAdapter);

export async function parseDotTransaction(txHex: string, material: Material, senderAddress?: string) {
  const adapter = defaultRegistry.get('dot');
  return adapter.parseTransaction!({ txHex, material, senderAddress });
}
