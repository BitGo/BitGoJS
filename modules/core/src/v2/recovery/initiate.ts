/**
 * @prettier
 */

import * as utxolib from '@bitgo/utxo-lib';
import { BitGo } from '../../bitgo';

export interface InitiateRecoveryOptions {
  userKey: string;
  backupKey: string;
  bitgoKey?: string; // optional for xrp recoveries
  recoveryDestination: string;
  walletPassphrase?: string;
}

export function getIsKrsRecovery({ backupKey, userKey }: InitiateRecoveryOptions): boolean {
  return backupKey.startsWith('xpub') && !userKey.startsWith('xpub');
}

export function getBip32Keys(
  bitgo: BitGo,
  params: InitiateRecoveryOptions,
  { requireBitGoXpub }: { requireBitGoXpub: boolean }
): utxolib.HDNode[] {
  const keys: utxolib.HDNode[] = [];
  const userKey = params.userKey; // Box A
  let backupKey = params.backupKey; // Box B
  const bitgoXpub = params.bitgoKey; // Box C
  const passphrase = params.walletPassphrase;
  const isKrsRecovery = getIsKrsRecovery(params);

  const validatePassphraseKey = (userKey: string, passphrase?: string): utxolib.HDNode => {
    try {
      if (!userKey.startsWith('xprv') && !userKey.startsWith('xpub')) {
        userKey = bitgo.decrypt({
          input: userKey,
          password: passphrase,
        });
      }
      return utxolib.HDNode.fromBase58(userKey);
    } catch (e) {
      throw new Error('Failed to decrypt user key with passcode - try again!');
    }
  };

  const key: utxolib.HDNode = validatePassphraseKey(userKey, passphrase);

  keys.push(key);

  // Validate the backup key
  try {
    if (!backupKey.startsWith('xprv') && !isKrsRecovery && !backupKey.startsWith('xpub')) {
      backupKey = bitgo.decrypt({
        input: backupKey,
        password: passphrase,
      });
    }
    const backupHDNode = utxolib.HDNode.fromBase58(backupKey);
    keys.push(backupHDNode);
  } catch (e) {
    throw new Error('Failed to decrypt backup key with passcode - try again!');
  }
  try {
    const bitgoHDNode = utxolib.HDNode.fromBase58(bitgoXpub);
    keys.push(bitgoHDNode);
  } catch (e) {
    if (requireBitGoXpub) {
      throw new Error('Failed to parse bitgo xpub!');
    }
  }

  return keys;
}
