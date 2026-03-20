/**
 * Go Account withdrawal approval
 *
 * When a Go Account withdrawal is subject to an approval policy, the transaction
 * lands in a pending state and must be approved by a second wallet administrator
 * before BitGo co-signs and broadcasts it.
 *
 * Important: you CANNOT approve your own transaction — a different admin must
 * approve it.  This script is intended to be run by the approving admin.
 *
 * This script supports two workflows:
 *
 *   A) Approve a known pending approval by ID
 *      Set PENDING_APPROVAL_ID and run the script.
 *
 *   B) List all pending approvals for a wallet and approve the first one
 *      Set OFC_WALLET_ID and leave PENDING_APPROVAL_ID empty — the script
 *      will list pending approvals and approve the first pending one.
 *
 * Required environment variables (in examples/.env):
 *   TESTNET_ACCESS_TOKEN       - access token of the APPROVING admin
 *   OFC_WALLET_ID              - the wallet ID of your Go Account
 *   OFC_WALLET_PASSPHRASE      - passphrase of the approving admin's key
 *   PENDING_APPROVAL_ID        - (optional) specific approval ID to approve
 *   APPROVAL_OTP               - (optional) OTP / 2FA code if required
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from 'bitgo';
require('dotenv').config({ path: '../../../.env' });

// Initialize BitGo SDK with the APPROVING admin's access token
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change to 'production' for mainnet
});

const baseCoin = 'ofc';
bitgo.register(baseCoin, coins.Ofc.createInstance);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Wallet ID whose pending approvals you want to manage */
const walletId = process.env.OFC_WALLET_ID || 'your_wallet_id';

/** Passphrase of the approving admin (used to re-sign if required) */
const walletPassphrase = process.env.OFC_WALLET_PASSPHRASE || 'your_wallet_passphrase';

/**
 * Specific pending approval ID to approve.
 * If empty the script lists all pending approvals for the wallet and approves
 * the first one it finds.
 */
const pendingApprovalId = process.env.PENDING_APPROVAL_ID || '';

/** OTP / 2FA code — required if your enterprise enforces it */
const otp = process.env.APPROVAL_OTP || '';

// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Go Account Withdrawal Approval ===\n');

  const coin = bitgo.coin(baseCoin);

  // -------------------------------------------------------------------------
  // Resolve the pending approval
  // -------------------------------------------------------------------------
  let approval: any;

  if (pendingApprovalId) {
    console.log(`Fetching pending approval ${pendingApprovalId}...`);
    approval = await coin.pendingApprovals().get({ id: pendingApprovalId });
    console.log(`✓ Found pending approval: ${approval.id()}`);
  } else {
    console.log(`Listing pending approvals for wallet ${walletId}...`);
    const { pendingApprovals } = await coin.pendingApprovals().list({ walletId });

    if (!pendingApprovals || pendingApprovals.length === 0) {
      console.log('No pending approvals found for this wallet.');
      return;
    }

    console.log(`✓ Found ${pendingApprovals.length} pending approval(s):\n`);
    for (const pa of pendingApprovals) {
      console.log(`  ID    : ${pa.id()}`);
      console.log(`  State : ${pa.state()}`);
      console.log(`  Type  : ${pa.type()}`);
      console.log('');
    }

    // Pick the first approval that is still pending
    approval = pendingApprovals.find((pa) => pa.state() === 'pending');
    if (!approval) {
      console.log('No approvals in "pending" state found.');
      return;
    }
    console.log(`Approving first pending approval: ${approval.id()}\n`);
  }

  // -------------------------------------------------------------------------
  // Print approval details before approving
  // -------------------------------------------------------------------------
  console.log('Approval details:');
  console.log(`  ID              : ${approval.id()}`);
  console.log(`  State           : ${approval.state()}`);
  console.log(`  Type            : ${approval.type()}`);
  console.log(`  Approvals req.  : ${approval.approvalsRequired()}`);

  const state = approval.state();
  if (state === 'pendingLivenessVerification') {
    console.log(
      '\n⚠️  This approval is in "pendingLivenessVerification" state.\n' +
        '   BitGo requires a liveness check (e.g. biometric or 2FA via the BitGo web app)\n' +
        '   before this transaction can be approved programmatically.\n' +
        '   Complete the liveness check in the BitGo portal and re-run this script.\n'
    );
    return;
  }
  if (state !== 'pending') {
    console.log(`\n⚠️  Approval is in state "${state}" — only "pending" approvals can be approved here.\n`);
    return;
  }
  const info = approval.info();
  if (info?.transactionRequest?.recipients) {
    console.log('  Recipients:');
    for (const r of info.transactionRequest.recipients) {
      console.log(`    ${r.address}  ${r.amount}${r.tokenName ? '  (' + r.tokenName + ')' : ''}`);
    }
  }
  console.log('');

  // -------------------------------------------------------------------------
  // Approve
  //
  // The SDK's pendingApproval.approve() attempts to rebuild the transaction
  // before approving, which fails for OFC wallets (off-chain transactions
  // don't need to be rebuilt). For OFC we call the API directly:
  //   PUT /api/v2/ofc/pendingapprovals/{id}  { state: 'approved', otp }
  // -------------------------------------------------------------------------
  console.log('Approving...');
  const approveUrl = coin.url('/pendingapprovals/' + approval.id());
  const body: { state: string; otp?: string } = { state: 'approved' };
  if (otp) body.otp = otp;
  const result = await (bitgo as any).put(approveUrl).send(body).result();

  console.log('✓ Approval submitted successfully!');
  console.log('\nApproval result:');
  console.log(JSON.stringify(result, null, 2));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('APPROVAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Approval ID : ${approval.id()}`);
  console.log(`  New state   : ${result.state || 'see result above'}`);
  if (result.txid) {
    console.log(`  Transaction : ${result.txid}`);
  }
  console.log('='.repeat(60));
}

main().catch((e) => {
  console.error('\n❌ Error during approval:', e);
  process.exit(1);
});
