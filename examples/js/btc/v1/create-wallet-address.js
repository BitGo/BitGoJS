'use strict';

/**
 * Create a new receive address on an existing v1 wallet.
 *
 * Legacy "safe" v1 wallets cannot create new addresses; the request fails with
 * an explicit error in that case.
 *
 * This uses the deprecated v1 `bitgo.wallets()` interface. It only applies to
 * legacy v1 wallets.
 *
 * Usage:
 *   node create-wallet-address.js WALLET_ID
 *
 * Requires BITGO_ENV and BITGO_ACCESS_TOKEN. See README.md.
 */

const { createClient, getWallet, printJson } = require('./bitgo-client');

async function main() {
  const [walletId] = process.argv.slice(2);
  const bitgo = createClient();
  const wallet = await getWallet(bitgo, walletId, 'node create-wallet-address.js WALLET_ID');

  const address = await wallet.createAddress();

  printJson({
    walletId: wallet.id(),
    address: address.address,
    chain: address.chain,
    index: address.index,
    path: address.path,
  });
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
