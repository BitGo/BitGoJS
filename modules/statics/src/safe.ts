import { BaseCoin, CoinKind } from './base';
import { OfcCoin } from './ofc';

/**
 * A safe's root slot, by (curve, scheme). Mirrors `RootKeyType` in `@bitgo/public-types`, which is the
 * canonical source of these names; statics cannot depend on that package.
 * @experimental
 */
export type SafeRootSlot = 'secp256k1Multisig' | 'ed25519Multisig' | 'ecdsaMpc' | 'eddsaMpc';

/**
 * Fixed ordinal (1–4) of each safe root slot: the `<slot>` segment of the safe child derivation path.
 * User children are hardened-derived at `m/44'/<bip44CoinType>'/<slot>'/<account>'` and multisig
 * co-signers are soft-derived at the same numeric path without hardening. The ordinals follow
 * `SAFE_ROOT_SLOTS` in `@bitgo/sdk-core`.
 * @experimental
 */
export const SAFE_ROOT_SLOT_ORDINALS: Record<SafeRootSlot, number> = {
  secp256k1Multisig: 1,
  ed25519Multisig: 2,
  ecdsaMpc: 3,
  eddsaMpc: 4,
};

/**
 * Whether safe child keys can be derived for the coin. OFC (off-chain virtual assets) and fiat
 * coins carry no `bip44CoinType` and cannot mint a safe child key.
 * @experimental
 */
export function isBip44Derivable(coin: Readonly<BaseCoin>): boolean {
  return !(coin instanceof OfcCoin) && coin.kind !== CoinKind.FIAT;
}
