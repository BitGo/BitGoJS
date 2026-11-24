'use strict';

/**
 * Get the balances of an existing v1 wallet.
 *
 * All values are integer satoshis. 100,000,000 satoshis = 1 BTC.
 *
 * - balance:          total balance, including unconfirmed funds
 * - confirmedBalance: confirmed funds only
 * - spendableBalance: funds available to spend (excludes external unconfirmed unspents)
 *
 * This uses the deprecated v1 `bitgo.wallets()` interface. It only applies to
 * legacy v1 wallets.
 *
 * Usage:
 *   node get-wallet-balance.js WALLET_ID
 *
 * Requires BITGO_ENV and BITGO_ACCESS_TOKEN. See README.md.
 */

const { createClient, getWallet, printJson } = require('./bitgo-client');

function satoshisToBtc(satoshis) {
  if (typeof satoshis !== 'number') {
    return null;
  }
  return (satoshis / 1e8).toFixed(8);
}

async function main() {
  const [walletId] = process.argv.slice(2);
  const bitgo = createClient();
  const wallet = await getWallet(bitgo, walletId, 'node get-wallet-balance.js WALLET_ID');

  const balance = wallet.balance();
  const confirmedBalance = wallet.confirmedBalance();
  const spendableBalance = wallet.spendableBalance();

  printJson({
    id: wallet.id(),
    label: wallet.label(),
    balance,
    confirmedBalance,
    spendableBalance,
    balanceBtc: satoshisToBtc(balance),
    confirmedBalanceBtc: satoshisToBtc(confirmedBalance),
    spendableBalanceBtc: satoshisToBtc(spendableBalance),
  });
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
