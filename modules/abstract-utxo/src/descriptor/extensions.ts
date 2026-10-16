import { DescriptorExtension, pox5 } from '@bitgo/utxo-descriptors';
import type { descriptorWallet, Psbt } from '@bitgo/wasm-utxo';

/**
 * Special-purpose descriptors that descriptor wallets accept next to their regular wallet descriptors.
 * This is the one place that lists them; the descriptor flow itself only deals with `DescriptorExtension`.
 */
export const defaultDescriptorExtensions: readonly DescriptorExtension[] = [pox5.descriptorExtension];

/**
 * Apply the spend policy of every extension to a PSBT that is about to be signed.
 * Throws if an extension refuses the spend.
 */
export function assertExtensionSpendPolicy(
  psbt: Psbt,
  descriptorMap: descriptorWallet.DescriptorMap,
  extensions: readonly DescriptorExtension[] = defaultDescriptorExtensions
): void {
  for (const extension of extensions) {
    extension.assertSpendPolicy(psbt, descriptorMap);
  }
}
