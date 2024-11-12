import { BIP32Interface } from '@bitgo/utxo-lib';

/**
 * Script type for a descriptor. This is either a p2sh (sh) or a p2sh-p2wsh (sh-wsh) script.
 */
export type ScriptType = 'sh' | 'sh-wsh';

function asDescriptorKey(key: BIP32Interface | Buffer, neutered: boolean): string {
  if (Buffer.isBuffer(key)) {
    return key.toString('hex');
  }
  return (neutered ? key.neutered() : key).toBase58() + '/*';
}

/**
 * Create a multi-sig descriptor to produce a coredao staking address
 * @param scriptType segwit or legacy
 * @param locktime locktime for CLTV
 * @param m Total number of keys required to unlock
 * @param orderedKeys If Bip32Interfaces, these are xprvs or xpubs and are derivable.
 *                    If they are buffers, then they are pub/prv keys and are not derivable.
 * @param neutered If true, neuter the keys. Default to true
 */
export function createMultiSigDescriptor(
  scriptType: ScriptType,
  locktime: number,
  m: number,
  orderedKeys: (BIP32Interface | Buffer)[],
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
  const keys = orderedKeys.map((key) => asDescriptorKey(key, neutered));
  const inner = `and_v(r:after(${locktime}),multi(${m},${keys.join(',')}))`;
  return scriptType === 'sh' ? `sh(${inner})` : `sh(wsh(${inner}))`;
}
