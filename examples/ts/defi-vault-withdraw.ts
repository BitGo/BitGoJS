/**
 * Withdraw vault shares from a DeFi ERC-4626 vault on staging.
 *
 * Run the deposit script first, then use this to withdraw.
 *
 * Usage:
 *   STAGING_ACCESS_TOKEN=<token> \
 *   STAGING_WALLET_ID=<walletId> \
 *   STAGING_WALLET_PASSPHRASE=<passphrase> \
 *   DEFI_VAULT_ID=<vaultId> \
 *   DEFI_WITHDRAW_AMOUNT=<shareTokenAmountInBaseUnits> \
 *   npx ts-node examples/ts/defi-vault-withdraw.ts
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';

require('dotenv').config({ path: '../../.env' });

const config = {
  accessToken: '',
  env: 'staging',
  walletId: '',
  vaultId: 'tbaseeth-usdc-test',
  amount: 1000000, // vault share base units
  passphrase: '',
  coin: 'tbaseeth',
  otp: '000000',
};

const bitgoTest = new BitGo({
  env: 'staging',
});

//bitgo.register('tbaseeth', TethLikeCoin.createInstance);

async function main() {
  console.log('Connecting to staging...');
  bitgoTest.authenticateWithAccessToken({ accessToken: config.accessToken });
  //await bitgoTest.unlock({ otp: config.otp, duration: 3600 });
  const wallet = await bitgoTest.coin('tbaseeth').wallets().get({ id: config.walletId });
  console.log('Wallet ID   :', wallet.id());
  console.log('Vault ID    :', config.vaultId);
  console.log('Amount      :', config.amount, '(vault share base units)');

  console.log('\nStarting withdrawal...');
  const result = await wallet.defi.withdrawFromVault({
    vaultId: config.vaultId,
    amount: config.amount.toString(),
    ...(config.passphrase ? { walletPassphrase: config.passphrase } : {}),
  });

  console.log('\nWithdrawal complete:');
  console.log('  operationId  :', result.operationId);
  console.log('  txRequestId  :', result.txRequestId);
  console.log('\nFull result:', JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error('Error:', e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
