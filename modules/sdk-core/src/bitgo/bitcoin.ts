/**
 * @hidden
 */

import * as utxolib from '@bitgo/utxo-lib';
import { BIP32Interface, ECPairInterface } from '@bitgo/utxo-lib';
import * as common from '../common';
import { V1Network } from './types';

/**
 * Returns the utxo-lib network object for the given V1 network name.
 * If no network is provided, falls back to the globally configured network.
 *
 * @param {V1Network} [network] - The V1 network name ('bitcoin' or 'testnet'). Defaults to the current global network.
 * @returns {utxolib.Network} The utxo-lib network parameters object.
 */
export function getNetwork(network?: V1Network): utxolib.Network {
  network = network || common.getNetwork();
  return utxolib.networks[network];
}

export function makeRandomKey(): ECPairInterface {
  return utxolib.ECPair.makeRandom({ network: getNetwork() as utxolib.BitcoinJSNetwork });
}

interface LegacyECPair {
  network: utxolib.Network;
  getPublicKeyBuffer(): Buffer;
}

export function getAddressP2PKH(key: ECPairInterface | BIP32Interface | LegacyECPair): string {
  let pubkey;
  if ('getPublicKeyBuffer' in key) {
    pubkey = key.getPublicKeyBuffer();
  } else {
    pubkey = key.publicKey;
  }
  const { address } = utxolib.payments.p2pkh({ pubkey, network: key.network as utxolib.BitcoinJSNetwork });
  if (!address) {
    throw new Error('could not compute address');
  }
  return address;
}
