import { BIP32, bip32, Psbt } from '@bitgo/wasm-utxo';

import { deriveKeyWithSeed } from '../deriveKeyWithSeed';
import { UtxoCoinName } from '../names';

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
  const wasmKey = typeof prv === 'string' ? BIP32.fromBase58(prv) : BIP32.fromBase58(prv.toBase58());
  const derivedKey = deriveKeyWithSeed(wasmKey, derivationId).key;
  if (!OfflineVaultSignable.is(tx)) {
    throw new Error('unsupported transaction type');
  }
  if (DescriptorTransaction.is(tx)) {
    return createHalfSignedFromPsbt(getHalfSignedPsbt(tx, derivedKey, coinName));
  }
  throw new Error('unsupported transaction type');
}
