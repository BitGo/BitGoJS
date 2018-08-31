// File for internal functions

/**
 * Internal function to centralize this route for wallet-scoped and enterprise-scoped queries
 * Params must contain either walletId or enterpriseId
 * @param params Id to query for pending transaction
 * @param baseCoin The coin object
 * @param bitgo The BitGo object
 * @returns result of the query
 */
exports.getFirstPendingTransaction = function(params, baseCoin, bitgo) {
  // These errors should never happen when this is called from wallet.js or enterprise.js
  if (!baseCoin) {
    throw new Error('Must provide baseCoin');
  }
  if (!bitgo) {
    throw new Error('Must provide BitGo object');
  }
  if (!params.walletId && !params.enterpriseId) {
    throw new Error('Must provide either walletId or enterpriseId');
  }
  return bitgo.get(baseCoin.url('/tx/pending/first'))
  .query(params)
  .result();
};
