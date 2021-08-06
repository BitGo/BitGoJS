/**
 * @prettier
 */

import * as utxolib from '@bitgo/utxo-lib';
import { BitGo } from '../../bitgo';

interface ValidateKeyOptions {
  key: string;
  source: string;
  passphrase?: string;
  isUnsignedSweep: boolean;
  isKrsRecovery: boolean;
}

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

export function getIsUnsignedSweep({ backupKey, userKey }: InitiateRecoveryOptions): boolean {
  return backupKey.startsWith('xpub') && userKey.startsWith('xpub');
}

export function validateKey(
  bitgo: BitGo,
  { key, source, passphrase, isUnsignedSweep, isKrsRecovery }: ValidateKeyOptions
): utxolib.HDNode {
  if (!key.startsWith('xprv') && !isUnsignedSweep) {
    // Try to decrypt the key
    try {
      if (source === 'user' || (source === 'backup' && !isKrsRecovery)) {
        return utxolib.HDNode.fromBase58(bitgo.decrypt({ password: passphrase, input: key }));
      }
    } catch (e) {
      throw new Error(`Failed to decrypt ${source} key with passcode - try again!`);
    }
  }
  try {
    return utxolib.HDNode.fromBase58(key);
  } catch (e) {
    throw new Error(`Failed to validate ${source} key - try again!`);
  }
}

export function getBip32Keys(
  bitgo: BitGo,
  params: InitiateRecoveryOptions,
  { requireBitGoXpub }: { requireBitGoXpub: boolean }
): utxolib.HDNode[] {
  const isKrsRecovery = getIsKrsRecovery(params);
  const isUnsignedSweep = getIsUnsignedSweep(params);
  const keys = [
    // Box A
    validateKey(bitgo, {
      key: params.userKey,
      source: 'user',
      passphrase: params.walletPassphrase,
      isKrsRecovery,
      isUnsignedSweep,
    }),
    // Box B
    validateKey(bitgo, {
      key: params.backupKey,
      source: 'backup',
      passphrase: params.walletPassphrase,
      isKrsRecovery,
      isUnsignedSweep,
    }),
  ];

  try {
    // Box C
    keys.push(utxolib.HDNode.fromBase58(params.bitgoKey));
  } catch (e) {
    if (requireBitGoXpub) {
      throw new Error('Failed to parse bitgo xpub!');
    }
  }

  return keys;
}
