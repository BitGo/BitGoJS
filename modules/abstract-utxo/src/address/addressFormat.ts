import * as utxolib from '@bitgo/utxo-lib';

/**
 * Canonicalize a Bitcoin Cash address for a specific version
 *
 * Starting on January 14th, 2018 Bitcoin Cash's bitcoin-abc node switched over to using cashaddr
 * encoding for all of their addresses in order to distinguish them from Bitcoin Core's.
 * https://www.bitcoinabc.org/cashaddr. We're sticking with the old base58 format because
 * migrating over to the new format will be laborious, and we want to see how the space evolves
 *
 * @param address may or may not be prefixed with the network, example bitcoincash:pppkt7q2axpsm2cajyjtu6x8fsh6ywauzgxmsru962 or pppkt7q2axpsm2cajyjtu6x8fsh6ywauzgxmsru962
 * @param version the version of the desired address, 'base58' or 'cashaddr', defaulting to 'base58'
 * @returns {*} address string
 */
export function canonicalAddress(network: utxolib.Network, address: string, format: unknown = 'base58'): string {
  if (
    utxolib.getMainnet(network) !== utxolib.networks.bitcoincash &&
    utxolib.getMainnet(network) !== utxolib.networks.ecash
  ) {
    // only the bitcoincash-like networks have different address formats
    return address;
  }

  if (format === 'base58') {
    return utxolib.addressFormat.toCanonicalFormat(address, network);
  }

  if (format === 'cashaddr') {
    const script = utxolib.addressFormat.toOutputScriptTryFormats(address, network);
    return utxolib.addressFormat.fromOutputScriptWithFormat(script, format, network);
  }

  throw new Error(`invalid format ${format}`);
}
