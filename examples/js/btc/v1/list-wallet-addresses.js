'use strict';

/**
 * List addresses for an existing v1 wallet.
 *
 * This uses the deprecated v1 `bitgo.wallets()` interface. It only applies to
 * legacy v1 wallets.
 *
 * Usage:
 *   node list-wallet-addresses.js WALLET_ID [LIMIT]
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
  const wallet = await getWallet(bitgo, walletId, 'node list-wallet-addresses.js WALLET_ID [LIMIT]');

  const result = await wallet.addresses({ limit });

  const addresses = (result.addresses || []).map((address) => ({
    address: address.address,
    chain: address.chain,
    index: address.index,
    path: address.path,
  }));

  printJson({
    walletId: wallet.id(),
    addresses,
    start: result.start,
    count: result.count,
    total: result.total,
  });
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
