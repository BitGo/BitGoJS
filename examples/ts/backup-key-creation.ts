/**
 * Create a backup key offline.
 *
 * This tool's intended use is for a customer to create a backup key for their wallet
 * that doesn't have access to the full service offering. BitGo is not responsible
 * for lost backup keys using this process.
 *
 * Copyright 2020, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc'; // Replace with your given coin (e.g. Ltc, Tltc)
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

// Set the coin name to match the blockchain and network
// btc = bitcoin, tbtc = testnet bitcoin
const coin = 'tbtc';
bitgo.register(coin, Tbtc.createInstance);

// Create the wallet
async function main() {
  // this function takes one parameter - seed - if you want to create from your own entropy (recommended)
  const backupKey = bitgo.coin(coin).keychains().create();

  console.log('BACK THIS UP: ');
  console.log(`Pub - this is what you add in the browser under the I have a backup key option: ${backupKey.pub}`);

  // extremely sensitive material
  console.log(`Prv - SENSITIVE MATERIAL - this is what you need to save: ${backupKey.prv}`);
}

main().catch((e) => console.error(e));
