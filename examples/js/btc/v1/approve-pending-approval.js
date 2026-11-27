'use strict';

/**
 * Approve a pending v1 withdrawal.
 *
 * Run this with the credentials of an authorized approver, not necessarily the
 * user who created the withdrawal. The approver must be permitted by the wallet
 * or enterprise policy.
 *
 * Approving can move funds. Review the approval first with
 * get-pending-approval.js. `approved` is not proof that the Bitcoin transaction
 * was broadcast or confirmed.
 *
 * For transaction requests, the SDK may need the wallet passphrase to rebuild
 * and sign the transaction if the original inputs have expired.
 *
 * This uses the deprecated v1 `bitgo.pendingApprovals()` interface. It only
 * applies to legacy v1 wallets.
 *
 * Usage:
 *   node approve-pending-approval.js APPROVAL_ID
 *
 * Requires BITGO_ENV, BITGO_ACCESS_TOKEN, BITGO_UNLOCK_OTP, and
 * BITGO_ACTION_OTP. Set BITGO_WALLET_PASSPHRASE only if the SDK may need to
 * rebuild and sign the transaction. See README.md.
 */

const { createClient, printJson, requireArgument, required, unlockSession } = require('./bitgo-client');

async function main() {
  const [approvalId] = process.argv.slice(2);
  const bitgo = createClient();

  const approval = await bitgo.pendingApprovals().get({
    id: requireArgument(approvalId, 'approval ID', 'node approve-pending-approval.js APPROVAL_ID'),
  });

  console.error('Approval to approve:');
  console.error(
    JSON.stringify(
      {
        id: approval.id(),
        type: approval.type(),
        state: approval.state(),
        walletId: approval.walletId(),
        enterpriseId: approval.enterpriseId(),
        approvalsRequired: approval.approvalsRequired(),
        info: approval.info(),
      },
      null,
      2
    )
  );

  await unlockSession(bitgo);

  const approveParams = {
    otp: required('BITGO_ACTION_OTP'),
  };
  if (process.env.BITGO_WALLET_PASSPHRASE) {
    approveParams.walletPassphrase = process.env.BITGO_WALLET_PASSPHRASE;
  }

  const result = await approval.approve(approveParams);

  printJson({
    id: result.id || approval.id(),
    state: result.state,
  });

  if (result.state === 'approved') {
    console.error(
      'Approval recorded. Check wallet history and Bitcoin network confirmations;\n' +
        'an approved state is not proof of broadcast or confirmation.'
    );
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
