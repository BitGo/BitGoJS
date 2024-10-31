import { BIP32Interface } from '@bitgo/utxo-lib';

/**
 * Script type for a descriptor. This is either a p2sh (sh) or a p2sh-p2wsh (sh-wsh) script.
 */
export type ScriptType = 'sh' | 'sh-wsh';

/**
 * Create a multi-sig descriptor to produce a coredao staking address
 * @param scriptType segwit or legacy
 * @param locktime locktime for CLTV
 * @param m Total number of keys required to unlock
 * @param orderedKeys
 * @param neutered If true, neuter the keys. Default to true
 */
export function createMultiSigDescriptor(
  scriptType: ScriptType,
  locktime: number,
  m: number,
  orderedKeys: BIP32Interface[],
  neutered = true
): string {
  if (m > orderedKeys.length || m < 1) {
    throw new Error(
      `m (${m}) must be less than or equal to the number of keys (${orderedKeys.length}) and greater than 0`
    );
  }
  if (locktime <= 0) {
    throw new Error(`locktime (${locktime}) must be greater than 0`);
  }

  const xpubs = orderedKeys.map((key) => (neutered ? key.neutered() : key).toBase58() + '/*');
  const inner = `and_v(r:after(${locktime}),multi(${m},${xpubs.join(',')}))`;
  return scriptType === 'sh' ? `sh(${inner})` : `sh(wsh(${inner}))`;
}
