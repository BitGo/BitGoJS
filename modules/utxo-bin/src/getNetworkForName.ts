import * as utxolib from '@bitgo/utxo-lib';

export function getNetworkForName(name: string): utxolib.Network {
  const network = utxolib.networks[name as utxolib.NetworkName];
  if (!network) {
    throw new Error(`invalid network ${name}`);
  }
  return network;
}

export function getNetwork(argv: { network: string }): utxolib.Network {
  return getNetworkForName(argv.network);
}
