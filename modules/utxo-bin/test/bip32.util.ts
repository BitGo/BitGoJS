import * as utxolib from '@bitgo/utxo-lib';
import * as crypto from 'crypto';
import { BIP32Interface } from 'bip32';

export type Triple<T> = [T, T, T];

export type KeyTriple = Triple<BIP32Interface>;
export function getKey(seed: string): BIP32Interface {
  return utxolib.bip32.fromSeed(crypto.createHash('sha256').update(seed).digest());
}
export function getKeyTriple(seed: string): KeyTriple {
  return [getKey(seed + '.0'), getKey(seed + '.1'), getKey(seed + '.2')];
}
