/**
 * Go Account — List Trading Products
 *
 * Retrieves the available trading pairs (products) for a prime trading account.
 * Use this to discover valid product symbols before placing a trade order.
 *
 * API: GET /api/prime/trading/v1/accounts/{ACCOUNT_ID}/products
 *
 * Required environment variables (in examples/.env):
 *   TESTNET_ACCESS_TOKEN   - your BitGo access token (must have trade_trade scope)
 *   OFC_WALLET_ID          - your Go Account wallet ID
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
require('dotenv').config({ path: '../../../.env' });

// Initialize BitGo SDK
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'staging', // Change to 'production' for mainnet
});

// ---------------------------------------------------------------------------
// Configuration — update these values or set them as environment variables
// ---------------------------------------------------------------------------

/**
 * Your Go Account wallet ID.
 * Find this in the BitGo portal or from the wallet object in your API responses.
 */
const accountId = process.env.OFC_WALLET_ID || 'your_wallet_id';

// ---------------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseIncrement: string;
  quoteIncrement: string;
  isTradeDisabled: boolean;
  isMarginTradeSupported: boolean;
}

interface ListProductsResponse {
  data: Product[];
}

async function main() {
  console.log('=== Go Account — List Trading Products ===\n');

  const url = (bitgo as any).microservicesUrl(
    `/api/prime/trading/v1/accounts/${accountId}/products`
  );

  console.log(`Fetching trading products for account ${accountId}...`);
  const response: ListProductsResponse = await (bitgo as any).get(url).result();

  const products: Product[] = response.data ?? [];

  if (products.length === 0) {
    console.log('No trading products found for this account.');
    return;
  }

  console.log(`✓ Found ${products.length} product(s)\n`);

  // Display a formatted table of available products
  const availableProducts = products.filter((p) => !p.isTradeDisabled);
  const disabledProducts = products.filter((p) => p.isTradeDisabled);

  console.log('Available trading pairs:');
  console.log('-'.repeat(70));
  console.log(
    `${'Product ID'.padEnd(24)} ${'Base'.padEnd(12)} ${'Quote'.padEnd(12)} ${'Margin'}`
  );
  console.log('-'.repeat(70));

  for (const p of availableProducts) {
    const margin = p.isMarginTradeSupported ? 'yes' : 'no';
    console.log(
      `${p.id.padEnd(24)} ${p.baseCurrency.padEnd(12)} ${p.quoteCurrency.padEnd(12)} ${margin}`
    );
  }

  if (disabledProducts.length > 0) {
    console.log(`\n${disabledProducts.length} pair(s) currently disabled for trading:`);
    for (const p of disabledProducts) {
      console.log(`  ${p.id} (${p.baseCurrency}/${p.quoteCurrency})`);
    }
  }

  console.log('\nFull response:');
  console.log(JSON.stringify(response, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Account ID        : ${accountId}`);
  console.log(`  Total products    : ${products.length}`);
  console.log(`  Available to trade: ${availableProducts.length}`);
  console.log(`  Disabled          : ${disabledProducts.length}`);
  console.log('='.repeat(60));

  console.log('\nNext step: use a product ID above with go-account-place-order.ts');
}

main().catch((e) => {
  console.error('\n❌ Error listing trading products:', e);
  process.exit(1);
});
