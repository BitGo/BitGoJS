/**
 * Create a new receive address on a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
// import {Tada} from "@bitgo/sdk-coin-ada";
import * as fs from 'fs';
import {Tbtc4} from "@bitgo/sdk-coin-btc";
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'staging',
});

const coin = 'tbtc4';
bitgo.register(coin, Tbtc4.createInstance);

const walletId = '68c2c81b0c675a64237702c4bc2501cc';
const enterpriseId = '671b54a59d6b9fca9873ad1f8f62f932';
const numAddresses = 215;

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  console.log('Wallet ID:', wallet.id());
  console.log(`Wallet label: ${wallet.label()}`);
  let csvRows = '';
  for (let i = 0; i < numAddresses; i++) {
    const newAddress = await wallet.createAddress();
    console.log(`Receive Address ${i + 1}:`, newAddress.address);
    const allocationAmount = Math.floor(Math.random() * 1_000_000);
    csvRows += `${coin},${allocationAmount},${walletId},${enterpriseId},${newAddress.address}\n`;
  }
  fs.appendFileSync('./receive-addresses.csv', csvRows);
  console.log('CSV file updated with receive addresses.');
}

main().catch((e) => console.error(e));
