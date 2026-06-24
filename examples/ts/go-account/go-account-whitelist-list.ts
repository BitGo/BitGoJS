/**
 * Go Account Whitelist List
 *
 * Fetches and displays all policy rules on a Go Account wallet,
 * including existing whitelist policy IDs and their whitelisted addresses.
 *
 * Use this to discover the correct policy ID before running
 * go-account-whitelist-update.ts.
 *
 * Required environment variables (in examples/.env):
 *   TESTNET_ACCESS_TOKEN   - your BitGo access token
 *   OFC_WALLET_ID          - the wallet ID of your Go Account
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from 'bitgo';
require('dotenv').config({ path: '../../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const baseCoin = 'ofc';
bitgo.register(baseCoin, coins.Ofc.createInstance);

const walletId = process.env.OFC_WALLET_ID || 'your_wallet_id';

async function main() {
  console.log('=== Go Account Whitelist List ===\n');

  const wallet = await bitgo.coin(baseCoin).wallets().get({ id: walletId });
  const rules: any[] = (wallet._wallet as any)?.admin?.policy?.rules || [];

  if (rules.length === 0) {
    console.log('No policy rules found on this wallet.');
    return;
  }

  console.log(`Found ${rules.length} policy rule(s):\n`);

  for (const rule of rules) {
    console.log(`  ID     : ${rule.id}`);
    console.log(`  Type   : ${rule.type}`);
    console.log(`  Action : ${rule.action?.type}`);

    const items = rule.condition?.addresses || rule.condition?.items || [];
    if (items.length > 0) {
      console.log(`  Whitelisted addresses (${items.length}):`);
      for (const item of items) {
        const addr = typeof item === 'string' ? item : item.item || item.address;
        const label = item?.metaData?.label ? ` (${item.metaData.label})` : '';
        console.log(`    - ${addr}${label}`);
      }
    }

    console.log('');
  }

  console.log('Full policy data:');
  console.log(JSON.stringify(rules, null, 2));
}

main().catch((e) => {
  console.error('\n❌ Error listing whitelist policies:', e);
  process.exit(1);
});
