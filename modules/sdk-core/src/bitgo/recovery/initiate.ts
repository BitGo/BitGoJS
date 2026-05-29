/**
 * @prettier
 */

import { bip32, BIP32Interface } from '@bitgo/utxo-lib';
import { BaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { KrsProvider, krsProviders } from '../config';

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

export interface InitiateConsolidationRecoveryOptions {
  userKey: string;
  backupKey: string;
  bitgoKey?: string;
  walletPassphrase?: string;
}

type GetKrsProviderOptions = { checkCoinFamilySupport?: boolean };

/**
 * @param coin
 * @param krsProviderName
 * @param checkCoinFamilySupport - assert that krsProvider explicitly supports coin
 * @return KrsProvider
 */
export function getKrsProvider(
  coin: BaseCoin,
  krsProviderName: string | undefined,
  { checkCoinFamilySupport = true }: GetKrsProviderOptions = {}
): KrsProvider {
  if (!krsProviderName) {
    throw new Error(`no krsProvider name`);
  }

  const krsProvider = krsProviders[krsProviderName];

  if (krsProvider === undefined) {
    throw new Error('unknown key recovery service provider');
  }

  if (checkCoinFamilySupport && !krsProvider.supportedCoins.includes(coin.getFamily())) {
    throw new Error('specified key recovery service does not support recoveries for this coin');
  }

  return krsProvider;
}

/**
 * Wrapper for {@see getKrsProvider} returning void
 */
export function checkKrsProvider(
  coin: BaseCoin,
  krsProviderName: string | undefined,
  options: GetKrsProviderOptions = {}
): void {
  getKrsProvider(coin, krsProviderName, options);
}

export function getIsKrsRecovery({ backupKey, userKey }: { backupKey: string; userKey: string }): boolean {
  return backupKey.startsWith('xpub') && !userKey.startsWith('xpub');
}

/**
 * Determine if the recovery is an unsigned sweep.
 * @deprecated Specify 'isUnsignedSweep' in params instead
 * @param backupKey
 * @param userKey
 * @param isTss
 */
export function getIsUnsignedSweep({
  backupKey,
  userKey,
  isTss,
}: {
  backupKey: string;
  userKey: string;
  isTss?: boolean;
}): boolean {
  if (isTss) {
    try {
      return typeof JSON.parse(backupKey) === 'string' && typeof JSON.parse(userKey) === 'string';
    } catch (e) {
      return true;
    }
  }
  return backupKey.startsWith('xpub') && userKey.startsWith('xpub');
}

function parseKeyAsXprv(key: string, source: string): BIP32Interface {
  try {
    return bip32.fromBase58(key);
  } catch (e) {
    throw new Error(`Failed to validate ${source} key - try again!`);
  }
}

function addBitgoKeyIfRequired(
  keys: BIP32Interface[],
  params: InitiateRecoveryOptions | InitiateConsolidationRecoveryOptions,
  requireBitGoXpub: boolean
): BIP32Interface[] {
  if (requireBitGoXpub) {
    if (!params.bitgoKey) {
      throw new Error(`BitGo xpub required but not provided`);
    }
    try {
      // Box C
      keys.push(bip32.fromBase58(params.bitgoKey));
    } catch (e) {
      throw new Error('Failed to parse bitgo xpub!');
    }
  }
  return keys;
}

/**
 * TODO: Deprecate this function in favour of validateKeyAsync when v2 encryption is the default.
 */
export function validateKey(
  bitgo: BitGoBase,
  { key, source, passphrase, isUnsignedSweep, isKrsRecovery }: ValidateKeyOptions
): BIP32Interface {
  if (!key.startsWith('xprv') && !isUnsignedSweep) {
    // Try to decrypt the key
    try {
      if (source === 'user' || (source === 'backup' && !isKrsRecovery)) {
        return bip32.fromBase58(bitgo.decrypt({ password: passphrase, input: key }));
      }
    } catch (e) {
      throw new Error(`Failed to decrypt ${source} key with passcode - try again!`);
    }
  }
  return parseKeyAsXprv(key, source);
}

/**
 * Async version of validateKey with v2 encrypt/decrypt support.
 */
export async function validateKeyAsync(
  bitgo: BitGoBase,
  { key, source, passphrase, isUnsignedSweep, isKrsRecovery }: ValidateKeyOptions
): Promise<BIP32Interface> {
  if (!key.startsWith('xprv') && !isUnsignedSweep) {
    try {
      if (source === 'user' || (source === 'backup' && !isKrsRecovery)) {
        return bip32.fromBase58(await bitgo.decryptAsync({ password: passphrase, input: key }));
      }
    } catch (e) {
      throw new Error(`Failed to decrypt ${source} key with passcode - try again!`);
    }
  }
  return parseKeyAsXprv(key, source);
}

/**
 * TODO: Deprecate this function in favour of getBip32KeysAsync when v2 encryption is the default.
 */
export function getBip32Keys(
  bitgo: BitGoBase,
  params: InitiateRecoveryOptions | InitiateConsolidationRecoveryOptions,
  { requireBitGoXpub }: { requireBitGoXpub: boolean }
): BIP32Interface[] {
  const isKrsRecovery = getIsKrsRecovery(params);
  const isUnsignedSweep = getIsUnsignedSweep(params);
  const validateKeyOpts = {
    passphrase: params.walletPassphrase,
    isKrsRecovery,
    isUnsignedSweep,
  };
  const keys = [
    // Box A
    validateKey(bitgo, { key: params.userKey, source: 'user', ...validateKeyOpts }),
    // Box B
    validateKey(bitgo, { key: params.backupKey, source: 'backup', ...validateKeyOpts }),
  ];

  return addBitgoKeyIfRequired(keys, params, requireBitGoXpub);
}

/**
 * Async version of getBip32Keys with v2 encrypt/decrypt support.
 */
export async function getBip32KeysAsync(
  bitgo: BitGoBase,
  params: InitiateRecoveryOptions | InitiateConsolidationRecoveryOptions,
  { requireBitGoXpub }: { requireBitGoXpub: boolean }
): Promise<BIP32Interface[]> {
  const isKrsRecovery = getIsKrsRecovery(params);
  const isUnsignedSweep = getIsUnsignedSweep(params);
  const validateKeyOpts = {
    passphrase: params.walletPassphrase,
    isKrsRecovery,
    isUnsignedSweep,
  };
  const keys = [
    // Box A — sequential: backup only after user completes
    await validateKeyAsync(bitgo, { key: params.userKey, source: 'user', ...validateKeyOpts }),
    // Box B
    await validateKeyAsync(bitgo, { key: params.backupKey, source: 'backup', ...validateKeyOpts }),
  ];

  return addBitgoKeyIfRequired(keys, params, requireBitGoXpub);
}
