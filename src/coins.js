// Coins supported by bitgo-bitcoinjs-lib
const typeforce = require('typeforce')

const coins = {
  BCH: 'bch',
  BTC: 'btc',
  BTG: 'btg',
  LTC: 'ltc',
  ZEC: 'zec'
}

coins.isBitcoin = function (value) {
  return typeforce.String(value) && value === coins.BTC
}

coins.isBitcoinCash = function (value) {
  return typeforce.String(value) && value === coins.BCH
}

coins.isBitcoinGold = function (value) {
  return typeforce.String(value) && value === coins.BTG
}

coins.isLitecoin = function (value) {
  return typeforce.String(value) && value === coins.LTC
}

coins.isZcash = function (value) {
  return typeforce.String(value) && value === coins.ZEC
}

coins.isValidCoin = function (value) {
  return typeforce.String(value) && value in [coins.BTC, coins.BCH, coins.BTG, coins.LTC, coins.ZEC]
}

module.exports = coins
