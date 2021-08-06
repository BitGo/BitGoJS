/**
 * @prettier
 */

import * as utxolib from '@bitgo/utxo-lib';
import { BitGo } from '../../bitgo';
import * as stellar from 'stellar-sdk';
import { BaseCoin } from '../baseCoin';
import * as config from '../../config';

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

export function getKrsProvider(
  coin: BaseCoin,
  krsProviderName: string | undefined,
  { checkCoinFamilySupport = true }: { checkCoinFamilySupport?: boolean } = {}
): config.KrsProvider {
  if (!krsProviderName) {
    throw new Error(`no krsProvider name`);
  }

  const krsProvider = config.krsProviders[krsProviderName];

  if (krsProvider === undefined) {
    throw new Error('unknown key recovery service provider');
  }

  if (checkCoinFamilySupport && !krsProvider.supportedCoins.includes(coin.getFamily())) {
    throw new Error('specified key recovery service does not support recoveries for this coin');
  }

  return krsProvider;
}

export function getIsKrsRecovery({ backupKey, userKey }: { backupKey: string; userKey: string }): boolean {
  return backupKey.startsWith('xpub') && !userKey.startsWith('xpub');
}

export function getIsUnsignedSweep({ backupKey, userKey }: { backupKey: string; userKey: string }): boolean {
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

export function getStellarKeys(bitgo: BitGo, params: InitiateRecoveryOptions): stellar.Keypair[] {
  const keys: stellar.Keypair[] = [];
  let userKey = params.userKey;
  let backupKey = params.backupKey;

  // Stellar's Ed25519 public keys start with a G, while private keys start with an S
  const isKrsRecovery = backupKey.startsWith('G') && !userKey.startsWith('G');
  const isUnsignedSweep = backupKey.startsWith('G') && userKey.startsWith('G');

  try {
    if (!userKey.startsWith('S') && !userKey.startsWith('G')) {
      userKey = bitgo.decrypt({
        input: userKey,
        password: params.walletPassphrase,
      });
    }

    const userKeyPair = isUnsignedSweep ? stellar.Keypair.fromPublicKey(userKey) : stellar.Keypair.fromSecret(userKey);
    keys.push(userKeyPair);
  } catch (e) {
    throw new Error('Failed to decrypt user key with passcode - try again!');
  }

  try {
    if (!backupKey.startsWith('S') && !isKrsRecovery && !isUnsignedSweep) {
      backupKey = bitgo.decrypt({
        input: backupKey,
        password: params.walletPassphrase,
      });
    }

    if (isKrsRecovery || isUnsignedSweep) {
      keys.push(stellar.Keypair.fromPublicKey(backupKey));
    } else {
      keys.push(stellar.Keypair.fromSecret(backupKey));
    }
  } catch (e) {
    throw new Error('Failed to decrypt backup key with passcode - try again!');
  }

  return keys;
}
