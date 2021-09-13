/**
 * @prettier
 */
import * as networks from './networks';
import { coins, Network } from './networkTypes';

const typeforce = require('typeforce');

/**
 * @returns {Network[]} all known networks as array
 */
export function getNetworkList(): Network[] {
  return Object.keys(networks).map((n) => networks[n]);
}

/**
 * @param {Network} network
 * @returns {string} the name of the network. Returns undefined if network is not a value
 *                   of `networks`
 */
export function getNetworkName(network: Network): string | undefined {
  return Object.keys(networks).find((n) => networks[n] === network);
}

/**
 * @param {Network} network
 * @returns {Object} the mainnet corresponding to a testnet
 */
export function getMainnet(network: Network): Network {
  switch (network) {
    case networks.bitcoin:
    case networks.testnet:
      return networks.bitcoin;

    case networks.bitcoincash:
    case networks.bitcoincashTestnet:
      return networks.bitcoincash;

    case networks.bitcoingold:
    case networks.bitcoingoldTestnet:
      return networks.bitcoingold;

    case networks.bitcoinsv:
    case networks.bitcoinsvTestnet:
      return networks.bitcoinsv;

    case networks.dash:
    case networks.dashTest:
      return networks.dash;

    case networks.litecoin:
    case networks.litecoinTest:
      return networks.litecoin;

    case networks.zcash:
    case networks.zcashTest:
      return networks.zcash;
  }
  throw new TypeError(`invalid network`);
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is a mainnet
 */
export function isMainnet(network: Network): boolean {
  return getMainnet(network) === network;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is a testnet
 */
export function isTestnet(network: Network): boolean {
  return getMainnet(network) !== network;
}

/**
 *
 * @param {Network} network
 * @param {Network} otherNetwork
 * @returns {boolean} true iff both networks are for the same coin
 */
export function isSameCoin(network: Network, otherNetwork: Network) {
  return getMainnet(network) === getMainnet(otherNetwork);
}

const mainnets = getNetworkList().filter(isMainnet);
const testnets = getNetworkList().filter(isTestnet);

/**
 * Map where keys are mainnet networks and values are testnet networks
 * @type {Map<Network, Network[]>}
 */
const mainnetTestnetPairs = new Map(mainnets.map((m) => [m, testnets.filter((t) => getMainnet(t) === m)]));

/**
 * @param {Network} network
 * @returns {Network|undefined} - The testnet corresponding to a mainnet.
 *                               Returns undefined if a network has no testnet.
 */
export function getTestnet(network: Network): Network | undefined {
  if (isTestnet(network)) {
    return network;
  }
  const testnets = mainnetTestnetPairs.get(network);
  if (testnets === undefined) {
    throw new Error(`invalid argument`);
  }
  if (testnets.length === 0) {
    return;
  }
  if (testnets.length === 1) {
    return testnets[0];
  }
  throw new Error(`more than one testnet for ${getNetworkName(network)}`);
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network bitcoin or testnet
 */
export function isBitcoin(network: Network) {
  return getMainnet(network) === networks.bitcoin;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoincash or bitcoincashTestnet
 */
export function isBitcoinCash(network: Network) {
  return getMainnet(network) === networks.bitcoincash;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoingold
 */
export function isBitcoinGold(network: Network) {
  return getMainnet(network) === networks.bitcoingold;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoinsv or bitcoinsvTestnet
 */
export function isBitcoinSV(network: Network) {
  return getMainnet(network) === networks.bitcoinsv;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is dash or dashTest
 */
export function isDash(network: Network) {
  return getMainnet(network) === networks.dash;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is litecoin or litecoinTest
 */
export function isLitecoin(network: Network) {
  return getMainnet(network) === networks.litecoin;
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is zcash or zcashTest
 */
export function isZcash(network) {
  return getMainnet(network) === networks.zcash;
}

/**
 * @param {unknown} network
 * @returns {boolean} returns true iff network is any of the network stated in the argument
 */
export function isValidNetwork(network: unknown): network is Network {
  return Object.values(networks).includes(network as Network);
}

/** @deprecated */
export const BCH = coins.BCH;
/** @deprecated */
export const BSV = coins.BSV;
/** @deprecated */
export const BTC = coins.BTC;
/** @deprecated */
export const BTG = coins.BTG;
/** @deprecated */
export const DASH = coins.DASH;
/** @deprecated */
export const LTC = coins.LTC;
/** @deprecated */
export const ZEC = coins.ZEC;
