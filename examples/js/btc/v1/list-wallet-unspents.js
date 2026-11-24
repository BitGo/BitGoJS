'use strict';

/**
 * List unspent outputs (UTXOs) for an existing v1 wallet.
 *
 * The amount on each unspent is in integer satoshis.
 *
 * This uses the deprecated v1 `bitgo.wallets()` interface. It only applies to
 * legacy v1 wallets.
 *
 * Usage:
 *   node list-wallet-unspents.js WALLET_ID [LIMIT]
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
  const wallet = await getWallet(bitgo, walletId, 'node list-wallet-unspents.js WALLET_ID [LIMIT]');

  const unspents = await wallet.unspents({ limit });

  const summary = unspents.map((unspent) => ({
    txid: unspent.txid,
    n: unspent.n,
    value: unspent.value,
    confirmations: unspent.confirmations,
    addresses: unspent.addresses,
    chainPath: unspent.chainPath,
  }));

  printJson({
    walletId: wallet.id(),
    unspents: summary,
    count: summary.length,
  });
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
