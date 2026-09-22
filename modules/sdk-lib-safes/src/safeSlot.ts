/**
 * @prettier
 *
 * @experimental Shared safe slot-for-coin mapping.
 *
 * Maps a coin chain + minting model to the safe root slot that derives it. The slot
 * is a signing scheme, not a coin: slot ① secp256k1Multisig serves UTXO + XRP + TRX + …,
 * slot ④ ed25519Multisig serves ALGO/XLM/HBAR, and the MPC slots serve TSS coins.
 *
 * The multisigType-vs-coin validation stays in sdk-core (it needs IBaseCoin); these
 * functions take only the chain so this leaf never imports sdk-core.
 */
import { coins, KeyCurve } from '@bitgo/statics';
import type { RootKeyType } from '@bitgo/public-types';

type OnchainSafeRootKeySlot = Extract<RootKeyType, 'secp256k1Multisig' | 'ed25519Multisig'>;
type TssSafeRootKeySlot = Extract<RootKeyType, 'ecdsaMpc' | 'eddsaMpc'>;

export function onchainSlotForCoin(chain: string): OnchainSafeRootKeySlot {
  const curve = coins.get(chain).primaryKeyCurve;
  if (curve === KeyCurve.Secp256k1) {
    return 'secp256k1Multisig';
  }
  if (curve === KeyCurve.Ed25519) {
    return 'ed25519Multisig';
  }
  throw new Error(`Coin '${chain}' is not supported for safe wallet minting`);
}

export function tssSlotForCoin(chain: string): TssSafeRootKeySlot {
  const curve = coins.get(chain).primaryKeyCurve;
  if (curve === KeyCurve.Secp256k1) {
    return 'ecdsaMpc';
  }
  if (curve === KeyCurve.Ed25519) {
    return 'eddsaMpc';
  }
  throw new Error(`Coin '${chain}' is not supported for safe wallet minting`);
}
