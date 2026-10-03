import { BaseCoin, CoinKind } from './base';
import { OfcCoin } from './ofc';

/**
 * Canonical order of a safe's four root slots, by (curve, scheme). The fixed ordinal of a slot
 * (1–4, in SAFE_ROOT_SLOTS order) is the `<slot>` segment of the safe child derivation scheme:
 * user children are hardened-derived at `m/44'/<bip44CoinType>'/<slot>'/<account>'`, and
 * multisig co-signers are soft-derived at the same numeric path without hardening
 * (`m/44/<bip44CoinType>/<slot>/<account>`).
 * @experimental
 */
export type SafeRootSlot = 'secp256k1Multisig' | 'ed25519Multisig' | 'ecdsaMpc' | 'eddsaMpc';

/**
 * The safe root slots in canonical order: the two multisig slots first, then the two MPC slots.
 * @experimental
 */
export const SAFE_ROOT_SLOTS: SafeRootSlot[] = ['secp256k1Multisig', 'ed25519Multisig', 'ecdsaMpc', 'eddsaMpc'];

/**
 * Fixed ordinal (1–4) of each safe root slot, in SAFE_ROOT_SLOTS order.
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
