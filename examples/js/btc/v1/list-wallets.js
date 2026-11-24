'use strict';

/**
 * List the existing v1 wallets available to the authenticated user.
 *
 * This uses the deprecated v1 `bitgo.wallets()` interface. It only applies to
 * legacy v1 wallets.
 *
 * Usage:
 *   node list-wallets.js [NEXT_BATCH_PREV_ID]
 *
 * Requires BITGO_ENV and BITGO_ACCESS_TOKEN. See README.md.
 */

const { createClient, printJson } = require('./bitgo-client');

async function main() {
  const [prevId] = process.argv.slice(2);
  const bitgo = createClient();

  const page = await bitgo.wallets().list({
    getbalances: true,
    ...(prevId ? { prevId } : {}),
  });

  const wallets = page.wallets.map((wallet) => ({
    id: wallet.id(),
    label: wallet.label(),
    type: wallet.type(),
    balance: wallet.balance(),
    confirmedBalance: wallet.confirmedBalance(),
    spendableBalance: wallet.spendableBalance(),
  }));

  printJson({
    wallets,
    nextBatchPrevId: page.nextBatchPrevId || null,
  });

  if (page.nextBatchPrevId) {
    console.error('More wallets are available. Pass nextBatchPrevId as the argument to fetch the next page.');
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
