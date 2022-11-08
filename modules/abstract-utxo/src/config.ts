// Supported cross-chain recovery routes. The object index is the coin to be recovered, and the value is
// an array of valid coins for recipient wallets of the original accidental/unintentional deposit.
export const supportedCrossChainRecoveries = {
  btc: ['bch', 'ltc', 'bsv', 'doge'],
  bch: ['btc', 'ltc', 'bsv', 'doge'],
  ltc: ['btc', 'bch', 'bsv', 'doge'],
  bsv: ['btc', 'ltc', 'bch', 'doge'],
  doge: ['btc', 'bch', 'ltc', 'bsv'],
  bcha: ['btc', 'bch'],
};
