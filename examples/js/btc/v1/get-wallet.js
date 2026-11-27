'use strict';

/**
 * Get an existing v1 wallet by ID.
 *
 * This uses the deprecated v1 `bitgo.wallets()` interface. It only applies to
 * legacy v1 wallets.
 *
 * Usage:
 *   node get-wallet.js WALLET_ID
 *
 * Requires BITGO_ENV and BITGO_ACCESS_TOKEN. See README.md.
 */

const { createClient, getWallet, printJson } = require('./bitgo-client');

async function main() {
  const [walletId] = process.argv.slice(2);
  const bitgo = createClient();
  const wallet = await getWallet(bitgo, walletId, 'node get-wallet.js WALLET_ID');

  printJson({
    id: wallet.id(),
    label: wallet.label(),
    type: wallet.type(),
    balance: wallet.balance(),
    confirmedBalance: wallet.confirmedBalance(),
    spendableBalance: wallet.spendableBalance(),
  });
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
