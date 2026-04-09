import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { ECPairInterface } from '@bitgo/utxo-lib';
import { getKey } from '@bitgo/utxo-core/testutil';

export function getECKey(seed: string): ECPairInterface {
  const { privateKey } = getKey(seed);
  assert(privateKey);
  return utxolib.ECPair.fromPrivateKey(privateKey);
}

export function getECKeys(key: string, count: number): ECPairInterface[] {
  return Array.from({ length: count }, (_, i) => getECKey(`${key}${i}`));
}

export function getXOnlyPubkey(key: ECPairInterface): Buffer {
  return key.publicKey.subarray(1);
}

export function fromXOnlyPublicKey(key: Buffer): ECPairInterface {
  for (const prefix of [0x02, 0x03]) {
    try {
      return utxolib.ECPair.fromPublicKey(Buffer.concat([Buffer.from([prefix]), key]));
    } catch {
      continue;
    }
  }
  throw new Error('Invalid x-only public key');
}
