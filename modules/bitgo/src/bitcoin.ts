/**
 * @hidden
 */

import * as bip32 from 'bip32';
import { common, V1Network } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

export function getNetwork(network?: V1Network): utxolib.Network {
  network = network || common.getNetwork();
  return utxolib.networks[network];
}

export function makeRandomKey(): utxolib.ECPair.ECPairInterface {
  return utxolib.ECPair.makeRandom({ network: getNetwork() as utxolib.BitcoinJSNetwork });
}

interface LegacyECPair {
  network: utxolib.Network;
  getPublicKeyBuffer(): Buffer;
}

export function getAddressP2PKH(key: utxolib.ECPair.ECPairInterface | bip32.BIP32Interface | LegacyECPair): string {
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
