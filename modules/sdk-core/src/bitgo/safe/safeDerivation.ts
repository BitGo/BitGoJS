/**
 * @prettier
 *
 * Shared safe child derivation for mint and sign.
 * Path: m/999999'/<index>' where index is the mint allocation stored on the
 * child key as derivedFromParentWithSeed.
 *
 * Soft deriveKeyWithSeed (m/999999/a/b) must not be used for safe children —
 * it cannot reproduce a hardened key.
 */
import { bip32 } from '@bitgo/utxo-lib';

/** BIP32 purpose for safe wallet derivation (hardened). */
export const SAFE_DERIVATION_PURPOSE = 999999;

export function getSafeHardenedDerivationPath(index: string | number): string {
  const idx = typeof index === 'number' ? String(index) : index;
  if (!/^\d+$/.test(idx)) {
    throw new Error(`Invalid safe derivation index '${index}': expected a non-negative integer`);
  }
  return `m/${SAFE_DERIVATION_PURPOSE}'/${idx}'`;
}

export interface SafeHardenedChildKey {
  prv: string;
  pub: string;
  derivationPath: string;
}

/** Hardened BIP32 derive for secp256k1 multisig from a root xprv and mint index. */
export function deriveSafeChildHardenedFromXprv(rootXprv: string, index: string | number): SafeHardenedChildKey {
  const derivationPath = getSafeHardenedDerivationPath(index);
  const child = bip32.fromBase58(rootXprv).derivePath(derivationPath);
  if (!child.privateKey) {
    throw new Error(`Failed to derive hardened safe child at ${derivationPath}`);
  }
  return {
    prv: child.toBase58(),
    pub: child.neutered().toBase58(),
    derivationPath,
  };
}
