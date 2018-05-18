// Coins supported by bitgo-bitcoinjs-lib

const typeforce = require('typeforce')

const coins = {
  BCH: 'bch',
  BTC: 'btc',
  BTG: 'btg',
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

coins.isZcash = function (value) {
  return typeforce.String(value) && value === coins.ZEC
}

module.exports = coins
