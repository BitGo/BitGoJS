/**
 * Fetch receive addresses with USDT balance and less than 35 TRX balance
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Trx } from '@bitgo/sdk-coin-trx';
import * as fs from 'fs';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: 'v2xcf332912a9df398e4bd8050c029786384a416e666138c5bd3c7eeb700c3cb2e8',
  env: 'prod',
});

const coin = 'trx:usdc';
bitgo.register(coin, Trx.createInstance);

const walletId = '64ef3307ce72c4000796e1ca3a2b597f';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  // const selectedAddresses: string[] = [];
  const addressesWithUsdt: string[] = [];
  // limit of addresses per building consolidation
  const limit = 1000;
  // set a prevId to start from specific page. Useful if the limit is reached
  let prevId = undefined;
  console.log('Wallet ID:', wallet.id());
  let index = 1;
  do {
    const addresses = await wallet.addresses({ includeBalances: true, prevId });
    prevId = addresses.nextBatchPrevId;
    for (const address of addresses.addresses) {
    console.log(`Address ${index}: ${address.address}`);
      const data = `${address.address}, needsConsolidation: ${address.needsConsolidation}, TRX balance: ${address.balance.spendableBalanceString}, USDC balance: ${address.balance.tokens['trx:usdc'].spendableBalanceString}\n`;
      fs.appendFileSync('trx-addresses-balance-list.txt', data);
      // if (address.needsConsolidation) {
      //   const data = `${address.address}, needsConsolidation: ${address.needsConsolidation}\n`;
      //   fs.appendFileSync('trx-consolidation-true.txt', data);
      // } else {
      //   const data = `${address.address}, needsConsolidation: ${address.needsConsolidation}\n`;
      //   fs.appendFileSync('trx-consolidation-false.txt', data);
      // }

      // if (address.balance.tokens['trx:usdc']) {
      //   console.log(`USDC token balance: `);
      //   console.log(address.balance.tokens['trx:usdc'].spendableBalanceString);
      //   console.log('TRX balance: ');
      //   console.log(address.balance.spendableBalanceString);
      //   // addressesWithUsdt.push(address.address);
      //   if (address.needsConsolidation) {
      //     const data = `${address.address}, needsConsolidation: ${address.needsConsolidation},USDC balance: ${address.balance.tokens['trx:usdc'].spendableBalanceString}, TRX balance: ${address.balance.spendableBalanceString}\n`;
      //     fs.appendFileSync('trx-addresses-with-usdc-needsConsolidation-true.txt', data);
      //   } else {
      //     const data = `${address.address}, needsConsolidation: ${address.needsConsolidation},USDC balance: ${address.balance.tokens['trx:usdc'].spendableBalanceString}, TRX balance: ${address.balance.spendableBalanceString}\n`;
      //     fs.appendFileSync('trx-addresses-with-usdc-needsConsolidation-false.txt', data);
      //   }
      // } else {
      //   console.log('Does not have USDC balance');
      //   fs.appendFileSync('trx-addresses-without-usdc.txt', `${address.address}\n`);
      // }
      index += 1;
      // console.log(`Balance: ${address.balance}`);
    }
  } while (prevId !== undefined && addressesWithUsdt.length < limit);
  // console.log('Final addresses with USDT');
  // console.log(addressesWithUsdt);
}

main().catch((e) => console.error(e));
