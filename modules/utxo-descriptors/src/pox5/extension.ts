import type { Descriptor } from '@bitgo/wasm-utxo';

import type { DescriptorExtension, WalletKeyTriple } from '../extension';

import { createPox5LockupDescriptor } from './descriptor';
import { parsePox5LockupDescriptor } from './parseDescriptor';
import { assertPox5SpendPolicy } from './spendPolicy';

/**
 * Whether the descriptor is a canonical PoX-5 lockup descriptor whose staker keys are the wallet keys.
 */
export function isWalletPox5Lockup(descriptor: Descriptor, walletKeys: WalletKeyTriple): boolean {
  try {
    const info = parsePox5LockupDescriptor(descriptor);
    if (!info) {
      return false;
    }
    // Rebuilding the canonical descriptor from the wallet keys checks both that the
    // staker keys are the wallet keys (with the `/*` derivation) and that the
    // descriptor has no non-canonical encoding.
    const canonical = createPox5LockupDescriptor({
      unlockHeight: info.unlockHeight,
      stakerCommitment: info.stakerCommitment,
      earlyExitKey: info.earlyExitKey,
      stakerKeys: [walletKeys[0], walletKeys[1], walletKeys[2]],
    });
    return canonical.toString() === descriptor.toString();
  } catch {
    // malformed lockup parameters
    return false;
  }
}

/** PoX-5 staking lockups as a descriptor wallet extension. */
export const descriptorExtension: DescriptorExtension = {
  name: 'pox5',
  isWalletDescriptor: isWalletPox5Lockup,
  assertSpendPolicy: assertPox5SpendPolicy,
};
