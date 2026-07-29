/**
 * Go Account — Get Trade Order
 *
 * Fetches the status and details of a specific trade order by order ID.
 * Use this to monitor execution after placing an order with go-account-place-order.ts.
 *
 * API: GET /api/prime/trading/v1/accounts/{ACCOUNT_ID}/orders/{ORDER_ID}
 *
 * Required environment variables (in examples/.env):
 *   TESTNET_ACCESS_TOKEN   - your BitGo access token (must have trade_trade scope)
 *   OFC_WALLET_ID          - your Go Account wallet ID
 *   TRADE_ORDER_ID         - the order ID returned by go-account-place-order.ts
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

/** The order ID returned when the order was placed */
const orderId = process.env.TRADE_ORDER_ID || 'your_order_id';

// ---------------------------------------------------------------------------

interface OrderResponse {
  id: string;
  accountId: string;
  clientOrderId: string;
  type: string;
  product: string;
  side: string;
  quantity: string;
  quantityCurrency: string;
  status: string;
  filledQuantity?: string;
  averagePrice?: string;
  limitPrice?: string;
  settleDate?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

async function main() {
  console.log('=== Go Account — Get Trade Order ===\n');

  const url = (bitgo as any).microservicesUrl(
    `/api/prime/trading/v1/accounts/${accountId}/orders/${orderId}`
  );

  console.log(`Fetching order ${orderId}...`);
  const order: OrderResponse = await (bitgo as any).get(url).result();

  console.log('✓ Order found\n');
  console.log('Full response:');
  console.log(JSON.stringify(order, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('ORDER STATUS');
  console.log('='.repeat(60));
  console.log(`  Order ID         : ${order.id}`);
  console.log(`  Client Order ID  : ${order.clientOrderId}`);
  console.log(`  Product          : ${order.product}`);
  console.log(`  Side             : ${order.side}`);
  console.log(`  Type             : ${order.type}`);
  console.log(`  Quantity         : ${order.quantity} ${order.quantityCurrency}`);
  if (order.limitPrice) {
    console.log(`  Limit Price      : ${order.limitPrice}`);
  }
  console.log(`  Status           : ${order.status}`);
  if (order.filledQuantity) {
    console.log(`  Filled Quantity  : ${order.filledQuantity}`);
  }
  if (order.averagePrice) {
    console.log(`  Average Price    : ${order.averagePrice}`);
  }
  if (order.settleDate) {
    console.log(`  Settle Date      : ${order.settleDate}`);
  }
  if (order.createdAt) {
    console.log(`  Created At       : ${order.createdAt}`);
  }
  if (order.updatedAt) {
    console.log(`  Updated At       : ${order.updatedAt}`);
  }
  console.log('='.repeat(60));
}

main().catch((e) => {
  console.error('\n❌ Error fetching trade order:', e);
  process.exit(1);
});
