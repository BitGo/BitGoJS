// Coins supported by bitgo-bitcoinjs-lib
const typeforce = require('typeforce')

const networks = require('./networks')

function isBitcoin (network) {
  return typeforce.value(networks.bitcoin.coin)(network.coin)
}

/**
 * @param network
 * @returns {boolean} true iff network is bitcoincash or bitcoincashTestnet
 */
function isBitcoinCash (network) {
  return typeforce.value(networks.bitcoincash.coin)(network.coin)
}

/**
 * @param network
 * @returns {boolean} true iff network is bitcoingold
 */
function isBitcoinGold (network) {
  return typeforce.value(networks.bitcoingold.coin)(network.coin)
}

/**
 * @param network
 * @returns {boolean} true iff network is bitcoinsv or bitcoinsvTestnet
 */
function isBitcoinSV (network) {
  return typeforce.value(networks.bitcoinsv.coin)(network.coin)
}

/**
 * @param network
 * @returns {boolean} true iff network is dash or dashTest
 */
function isDash (network) {
  return typeforce.value(networks.dash.coin)(network.coin)
}

/**
 * @param network
 * @returns {boolean} true iff network is litecoin or litecoinTest
 */
function isLitecoin (network) {
  return typeforce.value(networks.litecoin.coin)(network.coin)
}

/**
 * @param network
 * @returns {boolean} true iff network is zcash or zcashTest
 */
function isZcash (network) {
  return typeforce.value(networks.zcash.coin)(network.coin)
}

isValidCoin = typeforce.oneOf(
  isBitcoin,
  isBitcoinCash,
  isBitcoinSV,
  isBitcoinGold,
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
  isValidCoin
}
