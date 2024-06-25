import * as bitcoinjs from 'bitcoinjs-lib';

export type NetworkName = 'bitcoin' | 'testnet';
export type Network = bitcoinjs.Network;

export const networks: Record<NetworkName, Network> = {
  bitcoin: bitcoinjs.networks.bitcoin,
  testnet: bitcoinjs.networks.testnet,
};

/**
 * @returns {Network[]} all known networks as array
 */
export function getNetworkList(): Network[] {
  return Object.values(networks);
}

/**
 * @param {Network} network
 * @returns {NetworkName} the name of the network. Returns undefined if network is not a value
 *                        of `networks`
 */
export function getNetworkName(network: Network): NetworkName | undefined {
  return Object.keys(networks).find((n) => (networks as Record<string, Network>)[n] === network) as
    | NetworkName
    | undefined;
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
  }
  throw new TypeError(`invalid network`);
}

/**
 * @param {Network} network
 * @returns {Object} the testnet corresponding to a testnet
 */
export function getTestnet(network: Network): Network {
  switch (network) {
    case networks.bitcoin:
    case networks.testnet:
      return networks.testnet;
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
 * @param {unknown} network
 * @returns {boolean} returns true iff network is any of the network stated in the argument
 */
export function isValidNetwork(network: unknown): network is Network {
  return getNetworkList().includes(network as Network);
}

/**
 * @param {unknown} networkName
 * @returns {boolean} returns true iff network name is any of the network stated in the argument
 */
export function isValidNetworkName(networkName: unknown): networkName is NetworkName {
  return Object.keys(networks).some((v) => networkName === v);
}
