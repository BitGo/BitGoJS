'use strict';

/**
 * List recent transactions for an existing v1 wallet.
 *
 * The v1 interface calls these "transactions" (`wallet.transactions()`), not
 * "transfers".
 *
 * This uses the deprecated v1 `bitgo.wallets()` interface. It only applies to
 * legacy v1 wallets.
 *
 * Usage:
 *   node list-wallet-transfers.js WALLET_ID [LIMIT]
 *
 * Requires BITGO_ENV and BITGO_ACCESS_TOKEN. See README.md.
 */

const { createClient, getWallet, printJson } = require('./bitgo-client');

function parseLimit(value) {
  if (!value) {
    return 20;
  }
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('LIMIT must be a positive integer');
  }
  return limit;
}

async function main() {
  const [walletId, limitArg] = process.argv.slice(2);
  const limit = parseLimit(limitArg);
  const bitgo = createClient();
  const wallet = await getWallet(bitgo, walletId, 'node list-wallet-transfers.js WALLET_ID [LIMIT]');

  const result = await wallet.transactions({ limit });

  const transactions = (result.transactions || []).map((transaction) => ({
    id: transaction.id,
    date: transaction.date,
    confirmations: transaction.confirmations,
    pending: transaction.pending,
    height: transaction.height,
  }));

  printJson({
    walletId: wallet.id(),
    transactions,
    start: result.start,
    count: result.count,
    total: result.total,
  });
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
