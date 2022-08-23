// Supported cross-chain recovery routes. The coin to be recovered is the index, the valid coins for recipient wallets
// are listed in the array.
export const supportedCrossChainRecoveries = {
  btc: ['bch', 'ltc', 'bsv', 'doge'],
  bch: ['btc', 'ltc', 'bsv', 'doge'],
  ltc: ['btc', 'bch', 'bsv', 'doge'],
  bsv: ['btc', 'ltc', 'bch', 'doge'],
  doge: ['btc', 'bch', 'ltc', 'bsv'],
};
