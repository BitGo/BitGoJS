// Coins supported by bitgo-bitcoinjs-lib
const typeforce = require('typeforce')

const networks = require('./networks')

/**
 * @param network
 * @returns {string} the name of the network. Returns undefined if network is not a value
 *                   of `networks`
 */
function getNetworkName (network) {
  return Object.keys(networks).find(n => networks[n] === network)
}

/**
 * @param network
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
 * @param network
 * @returns {boolean} true iff network is a mainnet
 */
function isMainnet (network) {
  return getMainnet(network) === network
}

/**
 * @param network
 * @returns {boolean} true iff network is a testnet
 */
function isTestnet (network) {
  return getMainnet(network) !== network
}

const networksArray = Object.keys(networks).map(name => networks[name])
const mainnets = networksArray.filter(isMainnet)
const testnets = networksArray.filter(isTestnet)
const mainnetTestnetPairs = new Map(
  mainnets.map(m => [m, testnets.filter(t => getMainnet(t) === m)])
)

/**
 * @param network
 * @returns {Object|undefined} - The testnet corresponding to a mainnet.
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
 * @param network
 * @returns {boolean} true iff network bitcoin or testnet
 */
function isBitcoin (network) {
  return getMainnet(network) === networks.bitcoin
}

/**
 * @param network
 * @returns {boolean} true iff network is bitcoincash or bitcoincashTestnet
 */
function isBitcoinCash (network) {
  return getMainnet(network) === networks.bitcoincash
}

/**
 * @param network
 * @returns {boolean} true iff network is bitcoingold
 */
function isBitcoinGold (network) {
  return getMainnet(network) === networks.bitcoingold
}

/**
 * @param network
 * @returns {boolean} true iff network is bitcoinsv or bitcoinsvTestnet
 */
function isBitcoinSV (network) {
  return getMainnet(network) === networks.bitcoinsv
}

/**
 * @param network
 * @returns {boolean} true iff network is dash or dashTest
 */
function isDash (network) {
  return getMainnet(network) === networks.dash
}

/**
 * @param network
 * @returns {boolean} true iff network is litecoin or litecoinTest
 */
function isLitecoin (network) {
  return getMainnet(network) === networks.litecoin
}

/**
 * @param network
 * @returns {boolean} true iff network is zcash or zcashTest
 */
function isZcash (network) {
  return getMainnet(network) === networks.zcash
}

/**
 * @param network
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

  getNetworkName,

  getMainnet,
  isMainnet,
  getTestnet,
  isTestnet,

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
