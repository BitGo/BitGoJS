/**
 * Go Account Whitelist Update
 *
 * Adds or removes an address from a Go Account wallet's advanced whitelist policy.
 *
 * The whitelist policy (type: "advancedWhitelist") restricts withdrawals to only
 * pre-approved destination addresses. This script updates that list by either
 * adding or removing a single address per run.
 *
 * Two possible outcomes after calling the API:
 *   A) No approval required — update takes effect immediately.
 *   B) Approval required    — a pending approval is created; a second admin must
 *                             approve it (see go-account-approve.ts).
 *
 * Note: Self-custody wallet whitelist policies lock 48 hours after creation.
 *       Contact support@bitgo.com to unlock a locked policy before updating.
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

// Initialize BitGo SDK
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change to 'production' for mainnet
});

const baseCoin = 'ofc';
bitgo.register(baseCoin, coins.Ofc.createInstance);

// ---------------------------------------------------------------------------
// Configuration — update these values or set them as environment variables
// ---------------------------------------------------------------------------

/** The wallet ID of your Go Account */
const walletId = process.env.OFC_WALLET_ID || 'your_wallet_id';

/**
 * The name/ID of the whitelist policy rule to update.
 * This must match the `id` used when the policy was originally created.
 */
const policyId = process.env.WHITELIST_POLICY_ID || 'Offchain Wallet Whitelist';

/**
 * The address to add or remove from the whitelist.
 */
const address = process.env.WHITELIST_ADDRESS || 'your_address_here';

/**
 * Optional human-readable label for the address (only used when adding).
 */
const addressLabel = process.env.WHITELIST_ADDRESS_LABEL || '';

/**
 * Operation: 'add' to whitelist the address, 'remove' to de-list it.
 */
const operation: 'add' | 'remove' = (process.env.WHITELIST_OPERATION as 'add' | 'remove') || 'add';

// ---------------------------------------------------------------------------

async function main() {
  console.log(`=== Go Account Whitelist Update (${operation.toUpperCase()}) ===\n`);

  const coin = bitgo.coin(baseCoin);

  // Build the condition object — shape is the same for add and remove;
  // the key ('add' | 'remove') tells the API which operation to perform.
  const conditionItem: { type: string; item: string; metaData?: { label: string } } = {
    type: 'address',
    item: address,
  };
  if (operation === 'add' && addressLabel) {
    conditionItem.metaData = { label: addressLabel };
  }

  const body = {
    id: policyId,
    type: 'advancedWhitelist',
    condition: {
      [operation]: conditionItem,
    },
    action: {
      type: 'deny',
    },
  };

  console.log(`Wallet ID  : ${walletId}`);
  console.log(`Policy ID  : ${policyId}`);
  console.log(`Operation  : ${operation}`);
  console.log(`Address    : ${address}`);
  if (addressLabel && operation === 'add') {
    console.log(`Label      : ${addressLabel}`);
  }
  console.log('');
  console.log('Sending whitelist update...');

  const url = coin.url(`/wallet/${walletId}/policy/rule`);
  const result = await (bitgo as any).put(url).send(body).result();

  // Detect whether the response requires approval
  if (result.pendingApproval) {
    const approvalId =
      typeof result.pendingApproval === 'string' ? result.pendingApproval : result.pendingApproval.id;

    console.log('\n⚠  Approval required before this change takes effect.');
    console.log(`   A second administrator must approve pending approval: ${approvalId}`);
    console.log('   Use go-account-approve.ts (or the BitGo portal) to approve it.\n');

    console.log('Full response:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('WHITELIST UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Wallet ID          : ${walletId}`);
    console.log(`  Policy ID          : ${policyId}`);
    console.log(`  Operation          : ${operation}`);
    console.log(`  Address            : ${address}`);
    console.log(`  Status             : pending approval`);
    console.log(`  Pending Approval   : ${approvalId}`);
    console.log('='.repeat(60));
  } else {
    console.log('✓ Whitelist updated successfully!\n');
    console.log('Full response:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('WHITELIST UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Wallet ID  : ${walletId}`);
    console.log(`  Policy ID  : ${policyId}`);
    console.log(`  Operation  : ${operation}`);
    console.log(`  Address    : ${address}`);
    console.log(`  Status     : applied`);
    console.log('='.repeat(60));
  }
}

main().catch((e) => {
  console.error('\n❌ Error updating whitelist:', e);
  process.exit(1);
});
