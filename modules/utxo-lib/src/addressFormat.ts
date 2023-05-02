/**
 * Implements methods for nonstandard (non-canonical) address formats.
 *
 * Use `toOutputScriptTryFormats()` instead of `toOutputScript()` to parse addresses in
 * non-canonical formats
 */
import { getMainnet, getNetworkName, Network, networks } from './networks';
import { fromOutputScript, toOutputScript } from './address';

import { bcashAddress } from './bitgo';

export const addressFormats = ['default', 'cashaddr'] as const;

export type AddressFormat = (typeof addressFormats)[number];

/**
 * @param format
 * @param network
 * @return true iff format is supported for network
 */
export function isSupportedAddressFormat(format: AddressFormat, network: Network): boolean {
  switch (format) {
    case 'default':
      return true;
    case 'cashaddr':
      return [networks.bitcoincash, networks.ecash].includes(getMainnet(network));
  }
  throw new Error(`unknown address format ${format}`);
}

/**
 * @param outputScript
 * @param format
 * @param network
 * @return address formatted using provided AddressFormat
 */
export function fromOutputScriptWithFormat(outputScript: Buffer, format: AddressFormat, network: Network): string {
  if (!isSupportedAddressFormat(format, network)) {
    throw new Error(`unsupported address format ${format} for network ${getNetworkName(network)}`);
  }

  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.ecash:
      return bcashAddress.fromOutputScriptWithFormat(outputScript, format, network);
    default:
      return fromOutputScript(outputScript, network);
  }
}

/**
 * @param address
 * @param format
 * @param network
 * @return output script parsed with provided AddressFormat
 */
export function toOutputScriptWithFormat(address: string, format: AddressFormat, network: Network): Buffer {
  if (!isSupportedAddressFormat(format, network)) {
    throw new Error(`unsupported address format ${format} for network ${getNetworkName(network)}`);
  }

  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.ecash:
      return bcashAddress.toOutputScriptWithFormat(address, format, network);
    default:
      return toOutputScript(address, network);
  }
}

/**
 * Attempts to parse address with different address formats, returns first hit.
 * @param address
 * @param network
 * @param formats - defaults to all supported address formats for network
 * @return tuple with [AddressFormat, Buffer] containing format and parsed output script
 */
export function toOutputScriptAndFormat(
  address: string,
  network: Network,
  formats?: AddressFormat[]
): [AddressFormat, Buffer] {
  if (!formats) {
    formats = addressFormats.filter((f) => isSupportedAddressFormat(f, network));
  }

  for (const format of formats) {
    try {
      return [format, toOutputScriptWithFormat(address, format, network)];
    } catch (e) {
      // try next
    }
  }

  throw new Error(`could not parse outputScript [formats=${formats}]`);
}

/**
 * Same as `toOutputScriptAndFormat`, only returning script
 * @param address - {@see toOutputScriptAndFormat}
 * @param network - {@see toOutputScriptAndFormat}
 * @param formats - {@see toOutputScriptAndFormat}
 * @return parsed output script
 */
export function toOutputScriptTryFormats(address: string, network: Network, formats?: AddressFormat[]): Buffer {
  const [, outputScript] = toOutputScriptAndFormat(address, network, formats);
  return outputScript;
}

/**
 * @param address
 * @param network
 * @return address in canonical format
 */
export function toCanonicalFormat(address: string, network: Network): string {
  return fromOutputScript(toOutputScriptTryFormats(address, network), network);
}
