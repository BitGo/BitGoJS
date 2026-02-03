import { BIP32Interface, bip32 } from '@bitgo/secp256k1';
import { Psbt } from '@bitgo/wasm-utxo';
import { BaseCoin } from '@bitgo/sdk-core';

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
  prv: string | BIP32Interface,
  derivationId: string,
  tx: unknown
): OfflineVaultHalfSigned {
  if (typeof prv === 'string') {
    prv = bip32.fromBase58(prv);
  }
  prv = BaseCoin.deriveKeyWithSeedBip32(prv, derivationId).key;
  if (!OfflineVaultSignable.is(tx)) {
    throw new Error('unsupported transaction type');
  }
  if (DescriptorTransaction.is(tx)) {
    return createHalfSignedFromPsbt(getHalfSignedPsbt(tx, prv, coinName));
  }
  throw new Error('unsupported transaction type');
}
