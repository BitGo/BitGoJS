import * as utxolib from '@bitgo/utxo-lib';
import { Networks } from '@bitgo/statics';

/**
 * We want to return the verification pubkey from our statics that has our
 * verification pubkey.
 * @param network
 * @returns
 */
export function getPayGoVerificationPubkey(network: utxolib.Network): string | undefined {
  const networkName = utxolib.getNetworkName(network);
  if (utxolib.isTestnet(network)) {
    switch (networkName) {
      case 'testnet':
        return Networks.test.bitcoin.paygoAddressAttestationPubkey;
      default:
        return undefined;
    }
  } else if (utxolib.isMainnet(network)) {
    return undefined;
  }
}
