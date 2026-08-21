/**
 * @prettier
 *
 * @experimental Shared safe child derivation for mint and sign.
 *
 * User child: hardened `m/<index>'` from the sequential `safe.derivationIndex[slot]`.
 * Backup / BitGo children are soft-derived server-side at `m/<index>` (not here).
 *
 * Do not use `derivedFromParentWithSeed` / `deriveKeyWithSeed` (`m/999999/a/b`) —
 * that is the custody hashed path and cannot reproduce a safe child.
 */
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';

const MAX_BIP32_INDEX = 0x7fffffff;

/** Sign-time scan cap (wallet cap plus abandoned mint increments). */
export const MAX_SAFE_CHILD_INDEX_SCAN = 4096;

export function parseSafeDerivationIndex(index: string | number): number {
  let idx: number;
  if (typeof index === 'number') {
    idx = index;
  } else if (/^\d+$/.test(index)) {
    idx = Number(index);
  } else {
    throw new Error(`Invalid safe derivation index '${index}': expected a non-negative integer`);
  }
  if (!Number.isInteger(idx) || idx < 0 || idx > MAX_BIP32_INDEX) {
    throw new Error(`Invalid safe derivation index '${index}': expected a non-negative integer`);
  }
  return idx;
}

export function getSafeHardenedDerivationPath(index: string | number): string {
  return `m/${parseSafeDerivationIndex(index)}'`;
}

export interface SafeHardenedChildKey {
  prv: string;
  pub: string;
  derivationPath: string;
}

function childFromNode(child: BIP32Interface, derivationPath: string): SafeHardenedChildKey {
  if (!child.privateKey) {
    throw new Error(`Failed to derive hardened safe child at ${derivationPath}`);
  }
  return {
    prv: child.toBase58(),
    pub: child.neutered().toBase58(),
    derivationPath,
  };
}

export function deriveSafeChildHardenedFromXprv(rootXprv: string, index: string | number): SafeHardenedChildKey {
  const idx = parseSafeDerivationIndex(index);
  const derivationPath = getSafeHardenedDerivationPath(idx);
  return childFromNode(bip32.fromBase58(rootXprv).deriveHardened(idx), derivationPath);
}

/** Re-derive and assert both results match before the child is registered. */
export function deriveAndSelfCheckSafeChildHardened(rootXprv: string, index: string | number): SafeHardenedChildKey {
  const first = deriveSafeChildHardenedFromXprv(rootXprv, index);
  const second = deriveSafeChildHardenedFromXprv(rootXprv, index);
  if (first.pub !== second.pub || first.prv !== second.prv) {
    throw new Error(`Safe child self-check failed at ${first.derivationPath}: derivation was not deterministic`);
  }
  return first;
}

/** Walk `m/0'` … `m/<max>'` until the registered child pub matches. */
export function deriveSafeChildHardenedMatchingPub(
  rootXprv: string,
  expectedPub: string,
  maxIndex: number = MAX_SAFE_CHILD_INDEX_SCAN
): SafeHardenedChildKey {
  const root = bip32.fromBase58(rootXprv);
  const limit = parseSafeDerivationIndex(maxIndex);
  for (let i = 0; i <= limit; i++) {
    const derived = childFromNode(root.deriveHardened(i), getSafeHardenedDerivationPath(i));
    if (derived.pub === expectedPub) {
      return derived;
    }
  }
  throw new Error(`No hardened safe child at m/0'..m/${limit}' matched the registered public key`);
}
