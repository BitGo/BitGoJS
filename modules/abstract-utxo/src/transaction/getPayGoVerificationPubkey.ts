import * as utxolib from '@bitgo/utxo-lib';
import { Networks } from '@bitgo/statics';

/**
 * We want to return the verification pubkey from our statics that has our
 * verification pubkey.
 * @param network
 * @returns
 */
export function getPayGoVerificationPubkey(network: utxolib.Network): string | undefined {
  if (utxolib.isTestnet(network)) {
    return Networks.test.bitcoin.paygoAddressAttestationPubkey;
  } else if (utxolib.isMainnet(network)) {
    return undefined;
  }
}
