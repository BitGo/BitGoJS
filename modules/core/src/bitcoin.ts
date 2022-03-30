/**
 * @hidden
 */

import { ECPairInterface } from 'ecpair';
import { BIP32Interface } from 'bip32';
import * as common from './common';
import * as utxolib from '@bitgo/utxo-lib';
import { V1Network } from './v2/types';

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
