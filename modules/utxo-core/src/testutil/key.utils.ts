import * as crypto from 'crypto';

import { bip32, BIP32Interface } from '@bitgo/secp256k1';
import * as utxolib from '@bitgo/utxo-lib';

export type Triple<T> = [T, T, T];

export type KeyTriple = Triple<BIP32Interface>;

/**
 * Create new bip32 key. Uses random seed if none is passed.
 * @param seed
 */
export function getKey(seed?: string): BIP32Interface {
  const finalSeed = seed === undefined ? crypto.randomBytes(32) : crypto.createHash('sha256').update(seed).digest();
  return bip32.fromSeed(finalSeed);
}

/**
 * Return deterministic key triple of bip32 keys
 * @param prefix
 */
export function getKeyTriple(prefix = ''): KeyTriple {
  return Array.from({ length: 3 }).map((_, i) => getKey(`${prefix}${i}`)) as KeyTriple;
}

export function getRootWalletKeys(prefix = '', derivationPrefixes?: Triple<string>): utxolib.bitgo.RootWalletKeys {
  return new utxolib.bitgo.RootWalletKeys(getKeyTriple(prefix), derivationPrefixes);
}
