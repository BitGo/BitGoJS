/**
 * Deposit into a DeFi ERC-4626 vault on staging.
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
import { BitGo } from 'bitgo';

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

//bitgo.register('tbaseeth', TethLikeCoin.createInstance);

async function main() {
  console.log('Connecting to staging...');
  bitgoTest.authenticateWithAccessToken({ accessToken: config.accessToken });
  //await bitgoTest.unlock({ otp: config.otp, duration: 3600 });
  const wallet = await bitgoTest.coin('tbaseeth').wallets().get({ id: config.walletId });
  console.log('Wallet ID   :', wallet.id());
  console.log('Vault ID    :', config.vaultId);
  console.log('Amount      :', config.amount, '(base units)');

  console.log('\nStarting deposit...');
  const result = await wallet.defi.depositToVault({
    vaultId: config.vaultId,
    amount: config.amount.toString(),
    ...(config.passphrase ? { walletPassphrase: config.passphrase } : {}),
  });

  console.log('\nDeposit complete:');
  console.log('  operationId         :', result.operationId);
  console.log('  approve txRequestId :', result.txRequestIds.approve);
  console.log('  deposit txRequestId :', result.txRequestIds.deposit);
  console.log('\nFull result:', JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error('Error:', e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
