import { ECPairInterface } from '@bitgo/utxo-lib';

export function getXOnlyPubkey(key: ECPairInterface): Buffer {
  return key.publicKey.subarray(1);
}
