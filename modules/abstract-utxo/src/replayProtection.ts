import * as utxolib from '@bitgo/utxo-lib';
import { Unspent } from '@bitgo/utxo-lib/dist/src/bitgo';

export function getReplayProtectionAddresses(network: utxolib.Network): string[] {
  switch (network) {
    case utxolib.networks.bitcoincash:
      return ['33p1q7mTGyeM5UnZERGiMcVUkY12SCsatA'];
    case utxolib.networks.bitcoinsvTestnet:
    case utxolib.networks.bitcoincashTestnet:
      return ['2MuMnPoSDgWEpNWH28X2nLtYMXQJCyT61eY'];
  }

  return [];
}

export function isReplayProtectionUnspent(u: Unspent, network: utxolib.Network): boolean {
  return getReplayProtectionAddresses(network).includes(u.address);
}
