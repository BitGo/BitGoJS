/**
 * Add Low Fee webhook to a wallet.
 *
 * Copyright 2022 BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc'; // Replace with your given coin (e.g. Ltc, Tltc)
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

// TODO: set the coin name to match the blockchain and network
// btc = bitcoin, tbtc = testnet bitcoin
const coin = 'tbtc';
bitgo.register(coin, Tbtc.createInstance);

// TODO: set your wallet from the YYYYY parameter here in the URL on app.bitgo-test.com
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/teth/YYYYY/transactions
const walletId = '';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  const url = 'http://test.com/';
  const type = 'lowFee';

  wallet.addWebhook({ url: url, type: type });

  const webhooks = await wallet.listWebhooks();

  console.log(`Wallet Webhooks:  ${webhooks}`);
}

main().catch((e) => console.log(e));
