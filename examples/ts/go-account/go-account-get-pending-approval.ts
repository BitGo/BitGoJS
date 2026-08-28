/**
 * Go Account — Get Pending Approval
 *
 * Fetches the details of a specific pending approval by ID.
 * Use go-account-list-pending-approvals.ts to discover approval IDs.
 *
 * Required environment variables (in examples/.env):
 *   TESTNET_ACCESS_TOKEN   - your BitGo access token
 *   PENDING_APPROVAL_ID    - the pending approval ID to fetch
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from 'bitgo';
require('dotenv').config({ path: '../../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change to 'production' for mainnet
});

const baseCoin = 'ofc';
bitgo.register(baseCoin, coins.Ofc.createInstance);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** The pending approval ID to fetch */
const pendingApprovalId = process.env.PENDING_APPROVAL_ID || 'your_pending_approval_id';

// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Go Account — Get Pending Approval ===\n');

  console.log(`Fetching pending approval ${pendingApprovalId}...`);

  const coin = bitgo.coin(baseCoin);
  const pa = await coin.pendingApprovals().get({ id: pendingApprovalId });

  console.log('✓ Found\n');
  console.log('Full response:');
  console.log(JSON.stringify((pa as any)._pendingApproval, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('PENDING APPROVAL DETAILS');
  console.log('='.repeat(60));
  console.log(`  ID                : ${pa.id()}`);
  console.log(`  State             : ${pa.state()}`);
  console.log(`  Type              : ${pa.type()}`);
  console.log(`  Approvals required: ${pa.approvalsRequired()}`);

  const info = pa.info();
  if (info?.transactionRequest) {
    const tx = info.transactionRequest;
    if (tx.recipients) {
      console.log('  Recipients:');
      for (const r of tx.recipients) {
        console.log(`    ${r.address}  ${r.amount}${r.tokenName ? '  (' + r.tokenName + ')' : ''}`);
      }
    }
  }

  console.log('='.repeat(60));
  console.log('\nTip: use PENDING_APPROVAL_ID=<id> with go-account-approve.ts to approve this.');
}

main().catch((e) => {
  console.error('\n❌ Error fetching pending approval:', e);
  process.exit(1);
});
