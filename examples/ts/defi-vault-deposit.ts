/**
 * Deposit into a DeFi ERC-4626 vault (Morpho / Aave V3) with a self-custody
 * hot wallet on staging — including the gated and recovery flows.
 *
 * The deposit is two transactions that must land in order: an ERC-20 approve
 * for the vault, then the vault deposit. The SDK sequences both and links them
 * with an operationId.
 *
 * If a wallet policy gates a leg, the result carries `pendingApprovalIds` per
 * leg. Approve the legs in the UI (or via pendingApproval.approve()), then a
 * later session finishes the signing with the SDK's generic
 * wallet.signAndSendTxRequest — no DeFi-specific method needed.
 *
 * If a deposit for this wallet+vault is already in flight (previous run
 * crashed mid-flow, or still awaiting approval/confirmation),
 * depositToVault rejects with ActiveOperationExistsError; catching it and
 * resuming converges to the same result shape as a fresh deposit.
 *
 * Usage:
 *   STAGING_ACCESS_TOKEN=<token> \
 *   STAGING_WALLET_ID=<walletId> \
 *   STAGING_WALLET_PASSPHRASE=<passphrase> \
 *   DEFI_VAULT_ID=<vaultId> \
 *   DEFI_DEPOSIT_AMOUNT=<amountInBaseUnits> \
 *   npx ts-node examples/ts/defi-vault-deposit.ts
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo, ActiveOperationExistsError } from 'bitgo';

require('dotenv').config({ path: '../../.env' });

const config = {
  accessToken: '',
  env: 'staging',
  walletId: '',
  vaultId: 'tbaseeth-usdc-test',
  amount: 1000000, // 1 USDC
  passphrase: '',
  coin: 'tbaseeth',
  otp: '000000',
};

const bitgoTest = new BitGo({
  env: 'staging',
});
function sleep(ms: number): Promise<void> {
  // Executor form: the repo tsconfig targets es2020, so Promise.withResolvers
  // (es2024) would not typecheck under npx ts-node.
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForOperation(walletId: string, vaultId: string, operationId: string): Promise<void> {
  const wallet = await bitgoTest.coin(config.coin).wallets().get({ id: walletId });
  for (let attempt = 0; attempt < 30; attempt++) {
    // Operations are read back from the vault-scoped route.
    const operation = await wallet.defi.getOperation({ vaultId, operationId });
    console.log(`  operation ${operationId}: ${operation.state}`);
    if (operation.state === 'completed' || operation.state === 'cancelled') {
      return;
    }
    await sleep(5000);
  }
  console.log('  (gave up waiting — check the operation state in the UI)');
}

async function main() {
  console.log('Connecting to staging...');
  bitgoTest.authenticateWithAccessToken({ accessToken: config.accessToken });
  //await bitgoTest.unlock({ otp: config.otp, duration: 3600 });
  const wallet = await bitgoTest.coin(config.coin).wallets().get({ id: config.walletId });
  console.log('Wallet ID   :', wallet.id());
  console.log('Vault ID    :', config.vaultId);
  console.log('Amount      :', config.amount, '(base units)');

  const depositParams = {
    vaultId: config.vaultId,
    amount: config.amount.toString(),
    ...(config.passphrase ? { walletPassphrase: config.passphrase } : {}),
  };

  console.log('\nStarting deposit...');
  let result;
  try {
    result = await wallet.defi.depositToVault(depositParams);
  } catch (e) {
    if (e instanceof ActiveOperationExistsError) {
      // A deposit for this wallet+vault is already in flight. Same amount →
      // finish it; different amount → surface to the user and ask.
      console.log(
        `\nActive deposit already in flight: ${e.operationId}` +
          ` (vault ${e.vaultId}, amount ${e.assetAmount}) — resuming`
      );
      if (e.assetAmount !== config.amount.toString()) {
        console.log('  note: in-flight amount differs from the requested amount');
      }
      result = await wallet.defi.resumeDeposit({
        operationId: e.operationId,
        vaultId: e.vaultId,
        ...(config.passphrase ? { walletPassphrase: config.passphrase } : {}),
      });
    } else {
      throw e;
    }
  }

  console.log('\nDeposit legs:');
  console.log('  operationId         :', result.operationId);
  console.log('  approve txRequestId :', result.txRequestIds.approve);
  console.log('  deposit txRequestId :', result.txRequestIds.deposit);
  if (result.pendingApprovalIds) {
    console.log('\nA wallet policy gated the legs — approve them in the UI,');
    console.log('then finish each leg with the generic TSS recovery method:');
    console.log('  pendingApprovalIds  :', JSON.stringify(result.pendingApprovalIds));
    console.log(`
  // once each approval is approved (UI or pendingApprovals().get(...).approve(...)):
  // finish each leg with the generic TSS recovery method — DeFi legs are
  // FULL (apiVersion 'full') txRequests, so isTxRequestFull is required,
  // and the signed legs still need the explicit broadcast trigger:
  //   POST /wallet/{walletId}/txrequests/{txRequestId}/transfers
  await wallet.signAndSendTxRequest({
    txRequestId: result.txRequestIds.approve,
    walletPassphrase: config.passphrase,
    isTxRequestFull: true,
  });
  await wallet.signAndSendTxRequest({
    txRequestId: result.txRequestIds.deposit,
    walletPassphrase: config.passphrase,
    isTxRequestFull: true,
  });`);
    console.log(
      '\n(note: a resumed deposit that was already fully created returns leg ids' +
        ' only — discover its pending approvals via the wallet approval listing)'
    );
    return;
  }

  console.log('\nWaiting for the operation to complete...');
  await waitForOperation(config.walletId, config.vaultId, result.operationId);
  console.log('\nFull result:', JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error('Error:', e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
