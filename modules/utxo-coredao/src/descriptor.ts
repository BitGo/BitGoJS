import { BIP32Interface, bitgo } from '@bitgo/utxo-lib';

/**
 * Script type for a descriptor. This is either a p2sh (sh) or a p2wsh (wsh) script.
 */
export type ScriptType = 'sh' | 'wsh';

/**
 * Create a multi-sig descriptor to produce a coredao staking address
 * @param scriptType segwit or legacy
 * @param locktime locktime for CLTV
 * @param m Total number of keys required to unlock
 * @param orderedKeys
 */
export function createMultiSigDescriptor(
  scriptType: ScriptType,
  locktime: number,
  m: number,
  orderedKeys: BIP32Interface[]
): string {
  if (m > orderedKeys.length || m < 1) {
    throw new Error(
      `m (${m}) must be less than or equal to the number of keys (${orderedKeys.length}) and greater than 0`
    );
  }
  if (locktime <= 0) {
    throw new Error(`locktime (${locktime}) must be greater than 0`);
  }

  const xpubs = orderedKeys.map((key) => key.toBase58() + '/*');
  return `${scriptType}(and_v(r:after(${locktime}),multi(${m},${xpubs.join(',')}))`;
}

/**
 * Create a wallet descriptor to produce a coredao staking address for a standard BitGo wallet
 * @param scriptType
 * @param locktime
 * @param rootWalletKeys
 */
export function createWalletDescriptor(
  scriptType: ScriptType,
  locktime: number,
  rootWalletKeys: bitgo.RootWalletKeys
): string {
  return createMultiSigDescriptor(scriptType, locktime, 2, rootWalletKeys.triple);
}
