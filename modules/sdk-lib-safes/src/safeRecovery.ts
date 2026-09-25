/**
 * @prettier
 *
 * @experimental Shared safe recovery support registry.
 *
 * Declares which safe root slot x recovery-family pairs are supported for
 * offline recovery, and fails closed for everything else. v1 supports exactly
 * one pair: slot 1 (secp256k1Multisig) x utxo. The executable adapters live in
 * the coin layers (e.g. abstract-utxo); this leaf owns only the support truth
 * and the guard, so it never imports sdk-core or the coin packages.
 */
import type { RootKeyType } from '@bitgo/public-types';

export class SafeRecoveryUnsupportedError extends Error {
  public readonly code = 'SAFE_RECOVERY_UNSUPPORTED';

  constructor(public readonly slot: RootKeyType, public readonly family: string, public readonly coin?: string) {
    super(`Safe recovery for family '${family}' on slot '${slot}'${coin ? ` (coin '${coin}')` : ''} is not supported`);
    this.name = 'SafeRecoveryUnsupportedError';
  }
}

type SafeRecoverySupportedSlot = 'secp256k1Multisig';
type SafeRecoverySupportedFamily = 'utxo';

const SAFE_RECOVERY_SUPPORT: Record<SafeRecoverySupportedSlot, Record<SafeRecoverySupportedFamily, true>> = {
  secp256k1Multisig: {
    utxo: true,
  },
};

/**
 * Checks an already-resolved Safe recovery capability.
 *
 * TODO(WCN-2741): derive the slot from the concrete coin and recovery mode,
 * then invoke this guard before coin.recover() or any provider activity.
 */
export function assertSafeRecoverySupported(slot: RootKeyType, family: string, coin?: string): void {
  const supportedFamilies = (SAFE_RECOVERY_SUPPORT as Record<string, Record<string, boolean> | undefined>)[slot];
  if (supportedFamilies?.[family] !== true) {
    throw new SafeRecoveryUnsupportedError(slot, family, coin);
  }
}
