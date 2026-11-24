'use strict';

/**
 * Send BTC from an existing v1 wallet. This is the withdrawal example.
 *
 * The transaction is built and signed locally, then submitted to BitGo. BitGo
 * applies policy; if the wallet requires an approval, the send is not complete
 * yet (see README.md).
 *
 * Why this script does not call `wallet.sendCoins()`:
 * `sendCoins()` (through `sendMany()`) assumes the send response always contains
 * a transaction hex. When BitGo instead returns a pending approval, the SDK
 * throws while post-processing a response that was already submitted. This
 * script uses the same build/sign/send steps explicitly, so a pending approval
 * is returned as a normal result instead of an exception.
 *
 * This uses deprecated v1 interfaces. It only applies to legacy v1 wallets.
 *
 * Usage:
 *   node send-wallet-transaction.js WALLET_ID DESTINATION_ADDRESS AMOUNT_IN_SATOSHIS
 *
 * Requires BITGO_ENV, BITGO_ACCESS_TOKEN, BITGO_WALLET_PASSPHRASE,
 * BITGO_UNLOCK_OTP, and BITGO_ACTION_OTP. See README.md.
 *
 * Bitcoin transfers are irreversible. Verify the wallet, destination and amount
 * before running this script. Use BITGO_ENV=test unless you intend to send real
 * BTC.
 */

const { createClient, getWallet, parseSatoshis, printJson, required, unlockSession } = require('./bitgo-client');

function getPendingApprovalId(pendingApproval) {
  if (typeof pendingApproval === 'string') {
    return pendingApproval;
  }
  if (pendingApproval && typeof pendingApproval === 'object') {
    return pendingApproval.id || null;
  }
  return null;
}

async function main() {
  const [walletId, destination, amountArg] = process.argv.slice(2);
  const amount = parseSatoshis(
    amountArg,
    'amount',
    'node send-wallet-transaction.js WALLET_ID DESTINATION_ADDRESS AMOUNT_IN_SATOSHIS'
  );
  if (!destination) {
    throw new Error(
      'Provide the destination BTC address.\n' +
        'Usage: node send-wallet-transaction.js WALLET_ID DESTINATION_ADDRESS AMOUNT_IN_SATOSHIS'
    );
  }

  const bitgo = createClient();
  const wallet = await getWallet(
    bitgo,
    walletId,
    'node send-wallet-transaction.js WALLET_ID DESTINATION_ADDRESS AMOUNT_IN_SATOSHIS'
  );

  let signed;
  try {
    signed = await wallet.createAndSignTransaction({
      recipients: { [destination]: amount },
      walletPassphrase: required('BITGO_WALLET_PASSPHRASE'),
    });
  } catch (error) {
    throw new Error(`Failed to build or sign the transaction (nothing was submitted): ${error.message}`);
  }

  console.error(`Signed transaction. Fee: ${signed.fee} satoshis (fee rate: ${signed.feeRate} satoshis/kB).`);

  await unlockSession(bitgo);

  let result;
  try {
    result = await wallet.sendTransaction({
      tx: signed.tx,
      otp: required('BITGO_ACTION_OTP'),
    });
  } catch (error) {
    throw new Error(
      `The send request failed after the transaction was built. Its outcome is unknown: ${error.message}\n` +
        'Do not retry immediately. Check wallet history and pending approvals first (see README.md).'
    );
  }

  const pendingApprovalId = getPendingApprovalId(result.pendingApproval);
  printJson({
    status: result.status,
    hash: result.hash || null,
    pendingApprovalId,
    fee: signed.fee,
    feeRate: signed.feeRate,
    bitgoFee: signed.bitgoFee || null,
  });

  if (result.status === 'pendingApproval') {
    console.error(
      'The transaction needs approval. It has not been completed.\n' +
        (pendingApprovalId
          ? `Inspect it with: node get-pending-approval.js ${pendingApprovalId}`
          : 'List pending approvals for this wallet with: node list-pending-approvals.js ' + wallet.id())
    );
  } else if (result.status === 'accepted') {
    console.error(
      'BitGo accepted the transaction. This is not proof of blockchain confirmation.\n' +
        'Check the hash in wallet history and on the correct Bitcoin network.'
    );
  } else if (result.status === 'otp') {
    console.error(
      'BitGo requested another OTP. The send is not confirmed as complete.\n' +
        'Do not retry blindly; inspect wallet history and pending approvals first.'
    );
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});
