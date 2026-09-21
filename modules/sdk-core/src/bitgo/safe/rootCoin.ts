import { RootKeyType } from '@bitgo/public-types';
import { Environments } from '../../common';
import { IBaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';

/**
 * Canonical order of the safe root slots. Shared by safe minting (Safes.createSafeKeys) and
 * passkey register/remove (Safe) so both iterate the slots identically.
 * @experimental
 */
export const SAFE_ROOT_SLOTS: RootKeyType[] = ['secp256k1Multisig', 'ed25519Multisig', 'ecdsaMpc', 'eddsaMpc'];

/**
 * Representative coin per root slot, by network. Safe roots are curve/scheme-scoped, not
 * coin-scoped — WP stamps `curve` server-side from the coin's key curve, so any coin of the
 * right (curve, scheme) works. These are stable, always-available choices used only to route
 * the key ceremony; the resulting root is interchangeable across coins of the slot.
 * @experimental
 */
const ROOT_COIN_BY_NETWORK: Record<'mainnet' | 'testnet', Record<RootKeyType, string>> = {
  mainnet: {
    // multisig roots
    secp256k1Multisig: 'btc',
    ed25519Multisig: 'xlm',
    // MPC roots
    ecdsaMpc: 'eth',
    eddsaMpc: 'sol',
  },
  testnet: {
    // multisig roots
    secp256k1Multisig: 'tbtc',
    ed25519Multisig: 'txlm',
    // MPC roots
    ecdsaMpc: 'hteth',
    eddsaMpc: 'tsol',
  },
};

/**
 * Coin used to route a given root's key operations (see ROOT_COIN_BY_NETWORK).
 * @experimental
 */
export function coinForRoot(bitgo: BitGoBase, slot: RootKeyType): IBaseCoin {
  // V1Network is exactly 'bitcoin' | 'testnet', so this branch is exhaustive over every
  // environment: 'bitcoin' is mainnet and every other value is a testnet.
  const network = Environments[bitgo.getEnv()].network === 'bitcoin' ? 'mainnet' : 'testnet';
  return bitgo.coin(ROOT_COIN_BY_NETWORK[network][slot]);
}
