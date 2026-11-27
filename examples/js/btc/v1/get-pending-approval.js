'use strict';

/**
 * Get a pending approval by ID.
 *
 * Review the returned `info` before approving a withdrawal: confirm the type,
 * source wallet, destination, amount and fees. Approval details may be
 * sensitive.
 *
 * This uses the deprecated v1 `bitgo.pendingApprovals()` interface. It only
 * applies to legacy v1 wallets.
 *
 * Usage:
 *   node get-pending-approval.js APPROVAL_ID
 *
 * Requires BITGO_ENV and BITGO_ACCESS_TOKEN. See README.md.
 */

const { createClient, printJson, requireArgument } = require('./bitgo-client');

async function main() {
  const [approvalId] = process.argv.slice(2);
  const bitgo = createClient();

  const approval = await bitgo.pendingApprovals().get({
    id: requireArgument(approvalId, 'approval ID', 'node get-pending-approval.js APPROVAL_ID'),
  });

  printJson({
    id: approval.id(),
    type: approval.type(),
    state: approval.state(),
    ownerType: approval.ownerType(),
    walletId: approval.walletId(),
    enterpriseId: approval.enterpriseId(),
    approvalsRequired: approval.approvalsRequired(),
    info: approval.info(),
  });
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
