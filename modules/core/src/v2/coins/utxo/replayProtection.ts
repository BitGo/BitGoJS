import * as utxolib from '@bitgo/utxo-lib';

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
