/**
 * Create a new receive address on a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tbtc';
bitgo.register(coin, Tbtc.createInstance);

const walletPassphrase = '';

async function main() {
  const { wallet } = await bitgo.coin(coin).wallets().generateWallet({
    label: `Test Wallet Example`,
    passphrase: walletPassphrase,
    backupXpubProvider: 'keyternal',
  });

  const newReceiveAddress = await wallet.createAddress();

  console.log('Wallet ID:', wallet.id());
  console.log('First Receive Address:', wallet.receiveAddress());
  console.log('Second Receive Address:', newReceiveAddress.address);
}

main().catch((e) => console.error(e));
