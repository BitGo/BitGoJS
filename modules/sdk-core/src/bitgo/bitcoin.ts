import { common, V1Network } from '../index';
import * as utxolib from '@bitgo/utxo-lib';

export function getNetwork(network?: V1Network): utxolib.Network {
  network = network || common.getNetwork();
  return utxolib.networks[network];
}

export function makeRandomKey(): utxolib.ECPair.ECPairInterface {
  return utxolib.ECPair.makeRandom({ network: getNetwork() as utxolib.BitcoinJSNetwork });
}
