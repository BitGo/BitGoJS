/**
 * @hidden
 */

import * as bip32 from 'bip32';
import * as common from './common';
import * as utxolib from '@bitgo/utxo-lib';
import { V1Network } from './v2/types';

export function getNetwork(network?: V1Network): utxolib.Network {
  network = network || common.getNetwork();
  return utxolib.networks[network];
}

export function makeRandomKey(): utxolib.ECPair {
  return utxolib.ECPair.makeRandom({ network: getNetwork() });
}

export function getAddressP2PKH(key: utxolib.ECPair | bip32.BIP32Interface): string {
  const pkHash = utxolib.crypto.hash160(key.publicKey);
  return utxolib.address.fromOutputScript(
    utxolib.script.pubKeyHash.output.encode(pkHash),
    key.network,
  );
}
