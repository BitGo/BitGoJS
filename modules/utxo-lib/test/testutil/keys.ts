import { BIP32API, BIP32Factory, BIP32Interface } from 'bip32';
import * as crypto from 'crypto';

import { Triple } from '../../src/bitgo';
import { RootWalletKeys } from '../../src/bitgo/wallet/WalletKeys';
import { ecc } from '../../src/noble_ecc';

const bip32: BIP32API = BIP32Factory(ecc);

export type KeyTriple = Triple<BIP32Interface>;

function getKey(seed: string): BIP32Interface {
  return bip32.fromSeed(crypto.createHash('sha256').update(seed).digest());
}

export function getKeyTriple(seed: string): KeyTriple {
  return [getKey(seed + '.0'), getKey(seed + '.1'), getKey(seed + '.2')];
}

export function getDefaultCosigner<T>(keyset: Triple<T>, signer: T): T {
  const eq = (a: T, b: T) => a === b || (Buffer.isBuffer(a) && Buffer.isBuffer(b) && a.equals(b));
  const [user, backup, bitgo] = keyset;
  if (eq(signer, user)) {
    return bitgo;
  }
  if (eq(signer, backup)) {
    return bitgo;
  }
  if (eq(signer, bitgo)) {
    return user;
  }
  throw new Error(`signer not in pubkeys`);
}

export function getDefaultWalletKeys(): RootWalletKeys {
  return new RootWalletKeys(getKeyTriple('default'));
}
