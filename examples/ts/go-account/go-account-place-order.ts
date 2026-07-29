/**
 * Go Account — Place Trade Order
 *
 * Places a trade order (market, limit, or TWAP) on a Go Account via the
 * BitGo prime trading API.
 *
 * API: POST /api/prime/trading/v1/accounts/{ACCOUNT_ID}/orders
 *
 * Assets are reserved until the order completes.  Orders settle off-chain
 * on weekdays at 12:00 PM EST in production.  Testnet orders confirm but
 * do not settle.
 *
 * Rate limit: 10 requests/second
 *
 * Required environment variables (in examples/.env):
 *   TESTNET_ACCESS_TOKEN    - your BitGo access token (must have trade_trade scope)
 *   OFC_WALLET_ID           - your Go Account wallet ID
 *
 * Optional environment variables:
 *   TRADE_CLIENT_ORDER_ID   - unique client-generated order ID (auto-generated if omitted)
 *   TRADE_TYPE              - order type: 'market' | 'limit' | 'twap' (default: 'market')
 *   TRADE_PRODUCT           - product symbol, e.g. 'TBTC-TUSD*' (default: see below)
 *   TRADE_SIDE              - 'buy' or 'sell' (default: 'buy')
 *   TRADE_QUANTITY          - order quantity as a string (default: see below)
 *   TRADE_QUANTITY_CURRENCY - currency of the quantity, e.g. 'TBTC' (default: baseCurrency)
 *   TRADE_LIMIT_PRICE       - (limit orders) limit price as a string
 *   TRADE_DURATION          - (limit orders) duration in seconds
 *   TRADE_TIME_SLICED       - (twap) 'true' to enable time-slicing
 *   TRADE_INTERVAL          - (twap + time-sliced) execution interval in seconds
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { randomUUID } from 'crypto';
require('dotenv').config({ path: '../../../.env' });

// Initialize BitGo SDK
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change to 'production' for mainnet
});

// ---------------------------------------------------------------------------
// Configuration — update these values or set them as environment variables
// ---------------------------------------------------------------------------

/**
 * Your Go Account wallet ID.
 * Find this in the BitGo portal or from the wallet object in your API responses.
 */
const accountId = process.env.OFC_WALLET_ID || 'your_wallet_id';

/**
 * Unique identifier for this order.  Must be unique per account.
 * A UUID is generated automatically if not provided.
 */
const clientOrderId = process.env.TRADE_CLIENT_ORDER_ID || randomUUID();

/**
 * Order type.
 * - 'market': Execute immediately at best available price
 * - 'limit' : Execute at limitPrice or better; requires limitPrice + duration
 * - 'twap'  : Time-weighted average price; optionally set isTimeSliced + interval
 */
const orderType = (process.env.TRADE_TYPE as 'market' | 'limit' | 'twap') || 'market';

/**
 * Product (trading pair) symbol.
 * Run go-account-list-products.ts to see all available pairs.
 * Testnet example: 'TBTC-TUSD*'
 */
const product = process.env.TRADE_PRODUCT || 'TBTC-TUSD*';

/** Direction of the trade */
const side = (process.env.TRADE_SIDE as 'buy' | 'sell') || 'buy';

/**
 * Order quantity as a string.
 * The currency this represents is set by quantityCurrency below.
 */
const quantity = process.env.TRADE_QUANTITY || '0.001';

/**
 * Currency of the quantity field.
 * Use the base currency symbol (e.g. 'TBTC') to specify a fixed asset amount,
 * or the quote currency symbol (e.g. 'TUSD') to specify a fixed spend amount.
 */
const quantityCurrency = process.env.TRADE_QUANTITY_CURRENCY || 'TBTC';

// Limit order parameters (only used when orderType === 'limit')
const limitPrice = process.env.TRADE_LIMIT_PRICE;
const duration = process.env.TRADE_DURATION ? Number(process.env.TRADE_DURATION) : undefined;

// TWAP parameters (only used when orderType === 'twap')
const isTimeSliced = process.env.TRADE_TIME_SLICED === 'true';
const interval = process.env.TRADE_INTERVAL ? Number(process.env.TRADE_INTERVAL) : undefined;

// ---------------------------------------------------------------------------

interface OrderRequest {
  clientOrderId: string;
  type: 'market' | 'limit' | 'twap';
  product: string;
  side: 'buy' | 'sell';
  quantity: string;
  quantityCurrency: string;
  limitPrice?: string;
  duration?: number;
  isTimeSliced?: boolean;
  interval?: number;
}

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
  settleDate?: string;
  [key: string]: unknown;
}

async function main() {
  console.log('=== Go Account — Place Trade Order ===\n');

  // Build the request body
  const body: OrderRequest = {
    clientOrderId,
    type: orderType,
    product,
    side,
    quantity,
    quantityCurrency,
  };

  // Attach limit-order fields when applicable
  if (orderType === 'limit') {
    if (!limitPrice) {
      throw new Error('TRADE_LIMIT_PRICE is required for limit orders');
    }
    body.limitPrice = limitPrice;
    if (duration !== undefined) {
      body.duration = duration;
    }
  }

  // Attach TWAP fields when applicable
  if (orderType === 'twap') {
    if (isTimeSliced) {
      body.isTimeSliced = true;
      if (interval !== undefined) {
        body.interval = interval;
      }
    }
  }

  // Log what we are about to send
  console.log('Order details:');
  console.log(`  Account ID       : ${accountId}`);
  console.log(`  Client Order ID  : ${clientOrderId}`);
  console.log(`  Type             : ${orderType}`);
  console.log(`  Product          : ${product}`);
  console.log(`  Side             : ${side}`);
  console.log(`  Quantity         : ${quantity} ${quantityCurrency}`);
  if (limitPrice) {
    console.log(`  Limit Price      : ${limitPrice}`);
  }
  if (duration !== undefined) {
    console.log(`  Duration         : ${duration}s`);
  }
  if (isTimeSliced) {
    console.log(`  Time-Sliced      : yes`);
    if (interval !== undefined) {
      console.log(`  Interval         : ${interval}s`);
    }
  }
  console.log('');

  const url = (bitgo as any).microservicesUrl(
    `/api/prime/trading/v1/accounts/${accountId}/orders`
  );

  console.log('Placing trade order...');
  const response: OrderResponse = await (bitgo as any).post(url).send(body).result();

  console.log('✓ Order placed successfully!\n');
  console.log('Order response:');
  console.log(JSON.stringify(response, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('ORDER SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Order ID         : ${response.id}`);
  console.log(`  Client Order ID  : ${response.clientOrderId}`);
  console.log(`  Product          : ${response.product}`);
  console.log(`  Side             : ${response.side}`);
  console.log(`  Type             : ${response.type}`);
  console.log(`  Status           : ${response.status}`);
  if (response.filledQuantity) {
    console.log(`  Filled Quantity  : ${response.filledQuantity}`);
  }
  if (response.averagePrice) {
    console.log(`  Average Price    : ${response.averagePrice}`);
  }
  if (response.settleDate) {
    console.log(`  Settle Date      : ${response.settleDate}`);
  }
  console.log('='.repeat(60));

  console.log('\nNote: Assets are reserved until the order completes.');
  console.log('      Testnet orders confirm but do not settle.');
  console.log('      Production orders settle weekdays at 12:00 PM EST.');
}

main().catch((e) => {
  console.error('\n❌ Error placing trade order:', e);
  process.exit(1);
});
