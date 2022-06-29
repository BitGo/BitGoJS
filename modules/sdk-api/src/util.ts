import * as utxolib from '@bitgo/utxo-lib';
import { common, V1Network } from '@bitgo/sdk-core';

export function getNetwork(network?: V1Network): utxolib.Network {
  network = network || common.getNetwork();
  return utxolib.networks[network];
}
