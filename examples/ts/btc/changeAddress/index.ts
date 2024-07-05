/**
 * Send a transaction with a change address from a multi-sig wallet at BitGo.
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { changeAddressConfig } from './config';

const RECEIVE_ADDRESS = '';
const CHANGE_ADDRESS = '';

async function getWallet() {
  return await changeAddressConfig.sdk
    .coin(changeAddressConfig.coin)
    .wallets()
    .get({ id: changeAddressConfig.walletId });
}

/*
 * Usage: npx ts-node btc/externalChange/index.ts
 * */
async function main() {
  console.log('Starting...');

  const wallet = await getWallet();
  const tx = await wallet.sendMany({
    recipients: [
      {
        amount: '50000',
        address: RECEIVE_ADDRESS,
      },
    ],
    isReplaceableByFee: true,
    feeRate: 20_000, // 20 sat/vbyte
    walletPassphrase: changeAddressConfig.walletPassphrase,
    changeAddress: CHANGE_ADDRESS,
  });
  console.log('Transaction with custom change address: ', tx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
