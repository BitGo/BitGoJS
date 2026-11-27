'use strict';

/**
 * Reject (cancel) a pending v1 withdrawal.
 *
 * Rejection is a state-changing operation. Review the approval first with
 * get-pending-approval.js.
 *
 * This uses the deprecated v1 `bitgo.pendingApprovals()` interface. It only
 * applies to legacy v1 wallets.
 *
 * Usage:
 *   node reject-pending-approval.js APPROVAL_ID
 *
 * Requires BITGO_ENV, BITGO_ACCESS_TOKEN, and BITGO_UNLOCK_OTP. See README.md.
 */

const { createClient, printJson, requireArgument, unlockSession } = require('./bitgo-client');

async function main() {
  const [approvalId] = process.argv.slice(2);
  const bitgo = createClient();

  const approval = await bitgo.pendingApprovals().get({
    id: requireArgument(approvalId, 'approval ID', 'node reject-pending-approval.js APPROVAL_ID'),
  });

  await unlockSession(bitgo);

  const result = await approval.reject();

  printJson({
    id: result.id || approval.id(),
    state: result.state,
  });
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
