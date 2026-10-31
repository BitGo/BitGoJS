import { Triple, UnexpectedAddressError } from '@bitgo/sdk-core';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

/**
 * Prefix of the legacy scheme: every wallet key is derived at `m/0/0/<chain>/<index>`.
 * An address without a `derivationPrefix` always uses this prefix.
 */
export const LEGACY_DERIVATION_PREFIX = '0/0';

/**
 * Strip a single leading `m/` or `/` so prefixes recorded in PSBTs (`m/44/...`, `/44/...`)
 * compare equal to the relative form used on addresses (`44/...`).
 */
export function normalizeDerivationPrefix(prefix: string): string {
  if (prefix.startsWith('m/')) {
    return prefix.slice(2);
  }
  if (prefix.startsWith('/')) {
    return prefix.slice(1);
  }
  return prefix;
}

/**
 * Extract the non-legacy derivation prefix from the full path recorded for a PSBT output:
 * all components except the last two (`chain`, `index`), without a leading `m/` or `/`.
 *
 * Returns `undefined` when the path carries no prefix or the legacy `0/0` prefix, so callers
 * treat the output exactly as before. Any other prefix is returned unvalidated: it must be
 * checked with {@link assertCanonicalDerivationPrefix} before it is used for derivation.
 */
export function getDerivationPrefixFromPath(path: string | null | undefined): string | undefined {
  if (!path) {
    return undefined;
  }
  const components = normalizeDerivationPrefix(path).split('/');
  if (components.length < 3) {
    return undefined;
  }
  const prefix = components.slice(0, -2).join('/');
  return prefix === LEGACY_DERIVATION_PREFIX ? undefined : prefix;
}

/**
 * Assert that `derivationPrefix` is the canonical prefix of the wallet formed by `keys`:
 * the one recomputed from the three root keys and the coin's BIP44 coin type. A server (or PSBT)
 * supplied prefix is never trusted, so a different prefix is rejected as an unexpected address.
 *
 * @param keys the wallet's root xpubs `[user, backup, bitgo]`
 * @param derivationPrefix the prefix to check; leading `m/` or `/` is ignored
 * @param bip44CoinType the coin's BIP44 coin type (`coin.getConfig().bip44CoinType`)
 * @returns the canonical prefix (relative, no leading `/`)
 * @throws {Error} if the coin has no BIP44 coin type
 * @throws {UnexpectedAddressError} if the prefix is not the canonical one
 */
export function assertCanonicalDerivationPrefix(
  keys: Triple<string>,
  derivationPrefix: string,
  bip44CoinType: number | undefined
): string {
  if (bip44CoinType === undefined) {
    throw new Error(
      `cannot verify derivationPrefix "${derivationPrefix}": coin has no bip44 coin type and does not support per-wallet derivation prefixes`
    );
  }
  const expected = normalizeDerivationPrefix(fixedScriptWallet.deriveWalletPrefix(keys, bip44CoinType));
  if (normalizeDerivationPrefix(derivationPrefix) !== expected) {
    throw new UnexpectedAddressError(
      `address validation failure: derivationPrefix "${derivationPrefix}" is not the canonical prefix "${expected}" of the wallet keys`
    );
  }
  return expected;
}
