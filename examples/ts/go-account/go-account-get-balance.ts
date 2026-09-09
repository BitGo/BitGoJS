/**
 * Go Account — Get Balance
 *
 * Retrieves the balances for a Go Account via the prime trading API.
 * Shows per-currency balances including tradable, held, and total amounts.
 *
 * API: GET /api/prime/trading/v1/accounts/{ACCOUNT_ID}/balances
 * Docs: https://developers.bitgo.com/reference/tradeaccountsbalances
 *
 * Required environment variables (in examples/.env):
 *   TESTNET_ACCESS_TOKEN          - your BitGo access token
 *   OFC_WALLET_ID                 - your Go Account wallet ID
 *
 * Optional environment variables:
 *   INCLUDE_UNSETTLED_IN_AVAILABLE - set to 'true' to include unsettled trading
 *                                    balance in the available balance returned
 *                                    by the API (default: false)
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

/** Your Go Account wallet ID */
const accountId = process.env.OFC_WALLET_ID || 'your_wallet_id';

/**
 * When true, unsettled trading balance is included in the available balance
 * returned by the API. Withdrawals may be initiated from the unsettled
 * available balance, but trading settlement must occur before the withdrawal
 * can be processed.
 */
const includeUnsettledInAvailable = process.env.INCLUDE_UNSETTLED_IN_AVAILABLE === 'true';

// ---------------------------------------------------------------------------

interface Balance {
  currencyId: string;
  currency: string;
  balance: string;
  heldBalance: string;
  unsettledHeldBalance: string;
  tradableBalance: string;
  withdrawableBalance: string;
  rwaTradableBalance?: string;
  [key: string]: unknown;
}

interface GetBalancesResponse {
  data: Balance[];
  [key: string]: unknown;
}

async function main() {
  console.log('=== Go Account — Get Balance ===\n');
  console.log(`Include unsettled in available: ${includeUnsettledInAvailable}\n`);

  const url = (bitgo as any).microservicesUrl(
    `/api/prime/trading/v1/accounts/${accountId}/balances`
  );

  console.log(`Fetching balances for account ${accountId}...`);
  const response: GetBalancesResponse = await (bitgo as any)
    .get(url)
    .query({ includeUnsettledInAvailable })
    .result();

  const balances: Balance[] = response.data ?? (Array.isArray(response) ? response : []);

  if (balances.length === 0) {
    console.log('No balances found for this account.');
    return;
  }

  console.log(`✓ Found ${balances.length} currency balance(s)\n`);

  console.log('-'.repeat(80));
  console.log(
    `${'Currency'.padEnd(16)} ${'Balance'.padEnd(16)} ${'Available'.padEnd(16)} ${'Held'.padEnd(12)} Withdrawable`
  );
  console.log('-'.repeat(80));

  for (const b of balances) {
    console.log(
      `${b.currency.padEnd(16)} ${b.balance.padEnd(16)} ${b.tradableBalance.padEnd(16)} ${b.heldBalance.padEnd(12)} ${b.withdrawableBalance}`
    );
  }

  console.log('\nFull response:');
  console.log(JSON.stringify(response, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Account ID            : ${accountId}`);
  console.log(`  Currencies held       : ${balances.length}`);
  console.log(`  Include unsettled     : ${includeUnsettledInAvailable}`);
  for (const b of balances) {
    console.log(`  ${b.currency.padEnd(14)} : balance=${b.balance}, available=${b.tradableBalance}, held=${b.heldBalance}`);
  }
  console.log('='.repeat(60));
}

main().catch((e) => {
  console.error('\n❌ Error fetching Go Account balance:', e);
  process.exit(1);
});
