/**
 * Go Account — List Trade Orders
 *
 * Fetches all trade orders for a Go Account, with optional filtering by status.
 *
 * API: GET /api/prime/trading/v1/accounts/{ACCOUNT_ID}/orders
 *
 * Required environment variables (in examples/.env):
 *   TESTNET_ACCESS_TOKEN   - your BitGo access token (must have trade_trade scope)
 *   OFC_WALLET_ID          - your Go Account wallet ID
 *
 * Optional environment variables:
 *   TRADE_ORDER_STATUS     - filter by status: 'open' | 'filled' | 'cancelled' | 'rejected'
 *   TRADE_ORDER_PRODUCT    - filter by product symbol, e.g. 'TBTC4-TEUR'
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
require('dotenv').config({ path: '../../../.env' });

// Initialize BitGo SDK
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change to 'production' for mainnet
});

// ---------------------------------------------------------------------------
// Configuration — update these values or set them as environment variables
// ---------------------------------------------------------------------------

/** Your Go Account wallet ID */
const accountId = process.env.OFC_WALLET_ID || 'your_wallet_id';

/** Optional: filter orders by status */
const statusFilter = process.env.TRADE_ORDER_STATUS;

/** Optional: filter orders by product symbol */
const productFilter = process.env.TRADE_ORDER_PRODUCT;

// ---------------------------------------------------------------------------

interface Order {
  id: string;
  clientOrderId: string;
  type: string;
  product: string;
  side: string;
  quantity: string;
  quantityCurrency: string;
  status: string;
  filledQuantity?: string;
  averagePrice?: string;
  createdAt?: string;
  settleDate?: string;
  [key: string]: unknown;
}

interface ListOrdersResponse {
  data: Order[];
  [key: string]: unknown;
}

async function main() {
  console.log('=== Go Account — List Trade Orders ===\n');

  const url = (bitgo as any).microservicesUrl(
    `/api/prime/trading/v1/accounts/${accountId}/orders`
  );

  // Build query params
  const query: Record<string, string> = {};
  if (statusFilter) {
    query['status'] = statusFilter;
  }
  if (productFilter) {
    query['product'] = productFilter;
  }

  console.log(`Fetching orders for account ${accountId}...`);
  if (statusFilter) console.log(`  Status filter  : ${statusFilter}`);
  if (productFilter) console.log(`  Product filter : ${productFilter}`);
  console.log('');

  const response: ListOrdersResponse = await (bitgo as any).get(url).query(query).result();

  console.log('\nRaw response:');
  console.log(JSON.stringify(response, null, 2));

  const orders: Order[] = response.data ?? (Array.isArray(response) ? response : []);

  if (orders.length === 0) {
    console.log('No orders found.');
    return;
  }

  console.log(`✓ Found ${orders.length} order(s)\n`);

  // Display a formatted table
  console.log('-'.repeat(90));
  console.log(
    `${'Order ID'.padEnd(38)} ${'Product'.padEnd(16)} ${'Side'.padEnd(6)} ${'Type'.padEnd(8)} ${'Status'}`
  );
  console.log('-'.repeat(90));

  for (const o of orders) {
    console.log(
      `${o.id.padEnd(38)} ${o.product.padEnd(16)} ${o.side.padEnd(6)} ${o.type.padEnd(8)} ${o.status}`
    );
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Account ID     : ${accountId}`);
  console.log(`  Total orders   : ${orders.length}`);

  // Group by status
  const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`  ${status.padEnd(14)} : ${count}`);
  }
  console.log('='.repeat(60));

  console.log('\nTip: use TRADE_ORDER_ID=<id> with go-account-get-order.ts for full order details.');
}

main().catch((e) => {
  console.error('\n❌ Error listing trade orders:', e);
  process.exit(1);
});
