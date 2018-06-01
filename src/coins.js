// Coins supported by bitgo-bitcoinjs-lib
const typeforce = require('typeforce')

const coins = {
  BCH: 'bch',
  BTC: 'btc',
  BTG: 'btg',
  LTC: 'ltc',
  ZEC: 'zec'
}

coins.isBitcoin = function (network) {
  return typeforce.String(network.coin) && network.coin === coins.BTC
}

coins.isBitcoinCash = function (network) {
  return typeforce.String(network.coin) && network.coin === coins.BCH
}

coins.isBitcoinGold = function (network) {
  return typeforce.String(network.coin) && network.coin === coins.BTG
}

coins.isLitecoin = function (network) {
  return typeforce.String(network.coin) && network.coin === coins.LTC
}

coins.isZcash = function (network) {
  return typeforce.String(network.coin) && network.coin === coins.ZEC
}

coins.isValidCoin = function (network) {
  return typeforce.String(network.coin) && network.coin in [coins.BTC, coins.BCH, coins.BTG, coins.LTC, coins.ZEC]
}

module.exports = coins
