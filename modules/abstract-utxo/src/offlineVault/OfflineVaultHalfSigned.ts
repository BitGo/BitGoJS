import { BIP32, bip32, Psbt } from '@bitgo/wasm-utxo';
import { BaseCoin } from '@bitgo/sdk-core';

import { UtxoCoinName } from '../names';
import { toUtxolibBIP32 } from '../wasmUtil';

import { OfflineVaultSignable } from './OfflineVaultSignable';
import { DescriptorTransaction, getHalfSignedPsbt } from './descriptor';

export type OfflineVaultHalfSigned = {
  halfSigned: { txHex: string };
};

function createHalfSignedFromPsbt(psbt: Psbt): OfflineVaultHalfSigned {
  return { halfSigned: { txHex: Buffer.from(psbt.serialize()).toString('hex') } };
}

export function createHalfSigned(
  coinName: UtxoCoinName,
  prv: string | bip32.BIP32Interface,
  derivationId: string,
  tx: unknown
): OfflineVaultHalfSigned {
  const key = typeof prv === 'string' ? BIP32.fromBase58(prv) : prv;
  const derivedKey = BaseCoin.deriveKeyWithSeedBip32(toUtxolibBIP32(key), derivationId).key;
  if (!OfflineVaultSignable.is(tx)) {
    throw new Error('unsupported transaction type');
  }
  if (DescriptorTransaction.is(tx)) {
    return createHalfSignedFromPsbt(getHalfSignedPsbt(tx, derivedKey, coinName));
  }
  throw new Error('unsupported transaction type');
}
