/**
 * @prettier
 *
 * @experimental Shared safe slot-for-coin mapping.
 *
 * Maps a coin chain + minting model to the safe root slot that derives it. The slot
 * is a signing scheme, not a coin: slot ① secp256k1Multisig serves UTXO + XRP + TRX + …,
 * slot ② ed25519Multisig serves ALGO/XLM/HBAR, and the MPC slots serve TSS coins.
 *
 * The multisigType-vs-coin validation stays in sdk-core (it needs IBaseCoin); these
 * functions take only the chain so this leaf never imports sdk-core.
 */
import { coins, CoinFeature, KeyCurve } from '@bitgo/statics';
import type { RootKeyType } from '@bitgo/public-types';

type OnchainSafeRootKeySlot = Extract<RootKeyType, 'secp256k1Multisig' | 'ed25519Multisig'>;
type TssSafeRootKeySlot = Extract<RootKeyType, 'ecdsaMpc' | 'eddsaMpc'>;

/**
 * Exhaustive curve → slot registry. Pallas maps to nothing: a Pallas coin has no safe
 * root slot. The compiler guarantees every {@link KeyCurve} member is present.
 */
const CURVE_TO_SLOTS: Record<KeyCurve, { onchain?: OnchainSafeRootKeySlot; tss?: TssSafeRootKeySlot }> = {
  [KeyCurve.Secp256k1]: { onchain: 'secp256k1Multisig', tss: 'ecdsaMpc' },
  [KeyCurve.Ed25519]: { onchain: 'ed25519Multisig', tss: 'eddsaMpc' },
  [KeyCurve.Pallas]: {},
};

export function onchainSlotForCoin(chain: string): OnchainSafeRootKeySlot {
  const slot = CURVE_TO_SLOTS[coins.get(chain).primaryKeyCurve].onchain;
  if (!slot) {
    throw new Error(`Coin '${chain}' is not supported for safe wallet minting`);
  }
  return slot;
}

export function tssSlotForCoin(chain: string): TssSafeRootKeySlot {
  const slot = CURVE_TO_SLOTS[coins.get(chain).primaryKeyCurve].tss;
  if (!slot) {
    throw new Error(`Coin '${chain}' is not supported for safe wallet minting`);
  }
  return slot;
}

/**
 * Every safe root slot a coin can be minted under, in deterministic order (onchain first,
 * then tss). Mirrors wallet-platform's mint truth: the onchain slot is included iff the coin
 * carries {@link CoinFeature.MULTISIG}, the tss slot iff it carries {@link CoinFeature.TSS}.
 * A coin that mints under neither (e.g. a Pallas coin) yields `[]`.
 */
export function safeSlotsForCoin(chain: string): RootKeyType[] {
  const coin = coins.get(chain);
  const { onchain, tss } = CURVE_TO_SLOTS[coin.primaryKeyCurve];
  const slots: RootKeyType[] = [];
  if (onchain && coin.features.includes(CoinFeature.MULTISIG)) {
    slots.push(onchain);
  }
  if (tss && coin.features.includes(CoinFeature.TSS)) {
    slots.push(tss);
  }
  return slots;
}
