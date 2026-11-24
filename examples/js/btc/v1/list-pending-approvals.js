'use strict';

/**
 * List pending approvals for an existing v1 wallet or enterprise.
 *
 * The v1 API requires exactly one of walletId or enterpriseId.
 *
 * This uses the deprecated v1 `bitgo.pendingApprovals()` interface. It only
 * applies to legacy v1 wallets.
 *
 * Usage:
 *   node list-pending-approvals.js WALLET_ID
 *   node list-pending-approvals.js --enterprise ENTERPRISE_ID
 *
 * Requires BITGO_ENV and BITGO_ACCESS_TOKEN. See README.md.
 */

const { createClient, printJson, requireArgument } = require('./bitgo-client');

async function main() {
  const args = process.argv.slice(2);
  let params;

  if (args[0] === '--enterprise') {
    params = {
      enterpriseId: requireArgument(
        args[1],
        'enterprise ID',
        'node list-pending-approvals.js --enterprise ENTERPRISE_ID'
      ),
    };
  } else {
    params = {
      walletId: requireArgument(
        args[0],
        'wallet ID (or use --enterprise ENTERPRISE_ID)',
        'node list-pending-approvals.js WALLET_ID'
      ),
    };
  }

  const bitgo = createClient();
  const result = await bitgo.pendingApprovals().list(params);

  const pendingApprovals = result.pendingApprovals.map((approval) => ({
    id: approval.id(),
    type: approval.type(),
    state: approval.state(),
    walletId: approval.walletId(),
    enterpriseId: approval.enterpriseId(),
    approvalsRequired: approval.approvalsRequired(),
  }));

  printJson(pendingApprovals);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
