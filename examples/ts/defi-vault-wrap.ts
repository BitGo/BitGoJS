/**
 * Wrap native ETH into WETH (and unwrap it back) on staging.
 *
 * Wrap issues a single WETH9 `deposit()` call; unwrap issues `withdraw(uint256)`.
 * The wallet-platform builds the calldata and resolves the WETH9 address from the
 * vault binding — the SDK only forwards vaultId and amount.
 *
 * Set DEFI_WRAP_DIRECTION=unwrap to run the reverse direction.
 *
 * Wrap does not need to be awaited before depositing: the client is free to call
 * depositToVault() without waiting for the wrap to confirm.
 *
 * Usage:
 *   STAGING_ACCESS_TOKEN=<token> \
 *   STAGING_WALLET_ID=<walletId> \
 *   STAGING_WALLET_PASSPHRASE=<passphrase> \
 *   DEFI_VAULT_ID=<vaultId> \
 *   DEFI_WRAP_AMOUNT=<amountInBaseUnits> \
 *   DEFI_WRAP_DIRECTION=<wrap|unwrap> \
 *   npx ts-node examples/ts/defi-vault-wrap.ts
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';

require('dotenv').config({ path: '../../.env' });

const config = {
  accessToken: '',
  env: 'staging',
  walletId: '',
  vaultId: 'tbaseeth-weth-test',
  amount: '1000000000000000000', // 1 ETH — 18dp base units, kept as a string
  direction: 'wrap' as 'wrap' | 'unwrap',
  passphrase: '',
  coin: 'tbaseeth',
  otp: '000000',
};

const bitgoTest = new BitGo({
  env: 'staging',
});

async function main() {
  console.log('Connecting to staging...');
  bitgoTest.authenticateWithAccessToken({ accessToken: config.accessToken });
  //await bitgoTest.unlock({ otp: config.otp, duration: 3600 });
  const wallet = await bitgoTest.coin(config.coin).wallets().get({ id: config.walletId });
  console.log('Wallet ID   :', wallet.id());
  console.log('Vault ID    :', config.vaultId);
  console.log('Direction   :', config.direction);
  console.log('Amount      :', config.amount, config.direction === 'wrap' ? '(ETH base units)' : '(WETH base units)');

  const params = {
    vaultId: config.vaultId,
    amount: config.amount,
    ...(config.passphrase ? { walletPassphrase: config.passphrase } : {}),
  };

  console.log(`\nStarting ${config.direction}...`);
  const result = config.direction === 'wrap' ? await wallet.defi.wrap(params) : await wallet.defi.unwrap(params);

  console.log(`\n${config.direction} submitted:`);
  console.log('  txRequestId  :', result.txRequestId);
  // operationId is reserved for milestone M5 and is undefined today.
  console.log('\nFull result:', JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error('Error:', e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
