import * as utxolib from '@bitgo-beta/utxo-lib';
import { BIP32Interface } from '@bitgo-beta/utxo-lib';
import { BaseCoin } from '@bitgo-beta/sdk-core';

import { getNetworkFromChain } from '../names';

import { OfflineVaultSignable } from './OfflineVaultSignable';
import { DescriptorTransaction, getHalfSignedPsbt } from './descriptor';

export type OfflineVaultHalfSigned = {
  halfSigned: { txHex: string };
};

function createHalfSignedFromPsbt(psbt: utxolib.Psbt): OfflineVaultHalfSigned {
  return { halfSigned: { txHex: psbt.toHex() } };
}

export function createHalfSigned(
  coin: string,
  prv: string | BIP32Interface,
  derivationId: string,
  tx: unknown
): OfflineVaultHalfSigned {
  const network = getNetworkFromChain(coin);
  if (typeof prv === 'string') {
    prv = utxolib.bip32.fromBase58(prv);
  }
  prv = BaseCoin.deriveKeyWithSeedBip32(prv, derivationId).key;
  if (!OfflineVaultSignable.is(tx)) {
    throw new Error('unsupported transaction type');
  }
  if (DescriptorTransaction.is(tx)) {
    return createHalfSignedFromPsbt(getHalfSignedPsbt(tx, prv, network));
  }
  throw new Error('unsupported transaction type');
}
