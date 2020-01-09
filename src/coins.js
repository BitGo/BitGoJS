// Coins supported by bitgo-bitcoinjs-lib
const typeforce = require('typeforce')

const networks = require('./networks')

/**
 * @returns {Network[]} all known networks as array
 */
function getNetworkList () {
  return Object.keys(networks).map(n => networks[n])
}

/**
 * @param {Network} network
 * @returns {string} the name of the network. Returns undefined if network is not a value
 *                   of `networks`
 */
function getNetworkName (network) {
  return Object.keys(networks).find(n => networks[n] === network)
}

/**
 * @param {Network} network
 * @returns {Object} the mainnet corresponding to a testnet
 */
function getMainnet (network) {
  switch (network) {
    case networks.bitcoin:
    case networks.testnet:
      return networks.bitcoin

    case networks.bitcoincash:
    case networks.bitcoincashTestnet:
      return networks.bitcoincash

    case networks.bitcoingold:
    // FIXME(https://github.com/BitGo/bitgo-utxo-lib/issues/50): define bitcoingoldTest
      return networks.bitcoingold

    case networks.bitcoinsv:
    case networks.bitcoinsvTestnet:
      return networks.bitcoinsv

    case networks.dash:
    case networks.dashTest:
      return networks.dash

    case networks.litecoin:
    case networks.litecoinTest:
      return networks.litecoin

    case networks.zcash:
    case networks.zcashTest:
      return networks.zcash
  }
  throw new TypeError(`invalid network`)
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is a mainnet
 */
function isMainnet (network) {
  return getMainnet(network) === network
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is a testnet
 */
function isTestnet (network) {
  return getMainnet(network) !== network
}

/**
 *
 * @param {Network} network
 * @param {Network} otherNetwork
 * @returns {boolean} true iff both networks are for the same coin
 */
function isSameCoin (network, otherNetwork) {
  return getMainnet(network) === getMainnet(otherNetwork)
}

const mainnets = getNetworkList().filter(isMainnet)
const testnets = getNetworkList().filter(isTestnet)

/**
 * Map where keys are mainnet networks and values are testnet networks
 * @type {Map<Network, Network[]>}
 */
const mainnetTestnetPairs = new Map(
  mainnets.map(m => [m, testnets.filter(t => getMainnet(t) === m)])
)

/**
 * @param {Network} network
 * @returns {Network|undefined} - The testnet corresponding to a mainnet.
 *                               Returns undefined if a network has no testnet.
 */
function getTestnet (network) {
  if (isTestnet(network)) {
    return network
  }
  const testnets = mainnetTestnetPairs.get(network)
  if (testnets === undefined) {
    throw new Error(`invalid argument`)
  }
  if (testnets.length === 0) {
    return
  }
  if (testnets.length === 1) {
    return testnets[0]
  }
  throw new Error(`more than one testnet for ${getNetworkName(network)}`)
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network bitcoin or testnet
 */
function isBitcoin (network) {
  return getMainnet(network) === networks.bitcoin
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoincash or bitcoincashTestnet
 */
function isBitcoinCash (network) {
  return getMainnet(network) === networks.bitcoincash
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoingold
 */
function isBitcoinGold (network) {
  return getMainnet(network) === networks.bitcoingold
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoinsv or bitcoinsvTestnet
 */
function isBitcoinSV (network) {
  return getMainnet(network) === networks.bitcoinsv
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is dash or dashTest
 */
function isDash (network) {
  return getMainnet(network) === networks.dash
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is litecoin or litecoinTest
 */
function isLitecoin (network) {
  return getMainnet(network) === networks.litecoin
}

/**
 * @param {Network} network
 * @returns {boolean} true iff network is zcash or zcashTest
 */
function isZcash (network) {
  return getMainnet(network) === networks.zcash
}

/**
 * @param {Network} network
 * @returns {boolean} returns true iff network is any of the network stated in the argument
 */
const isValidNetwork = typeforce.oneOf(
  isBitcoin,
  isBitcoinCash,
  isBitcoinGold,
  isBitcoinSV,
  isDash,
  isLitecoin,
  isZcash
)

module.exports = {
  BTC: networks.bitcoin.coin,
  BCH: networks.bitcoincash.coin,
  BSV: networks.bitcoinsv.coin,
  BTG: networks.bitcoingold.coin,
  DASH: networks.dash.coin,
  LTC: networks.litecoin.coin,
  ZEC: networks.zcash.coin,

  getNetworkList,
  getNetworkName,

  getMainnet,
  isMainnet,
  getTestnet,
  isTestnet,
  isSameCoin,

  isBitcoin,
  isBitcoinCash,
  isBitcoinGold,
  isBitcoinSV,
  isDash,
  isLitecoin,
  isZcash,

  isValidNetwork,
  /**
   * @deprecated: use isValidNetwork
   */
  isValidCoin: isValidNetwork
}
