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
  accessToken: 'v2x85138683fa5ba90238288cca98ea7d55ac314d3d9f1ddd517361d6319779e861',
  env: 'prod',
});

const coin = 'trx:usdt';
bitgo.register(coin, Trx.createInstance);

const walletId = '65c92e309813370260d588da93c791f6';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  let prevId = undefined;
  let index = 1;

  // r1: usdt 10, trx: 10 (true)

  // r2:usdt 10, trx: 36 (true)
  // r3:usdt 10, trx: 36
  // r4: (false)

  // Fetch all addresses with needsConsolidation [false, true]


  do {
    const addresses = await wallet.addresses({ includeBalances: true, prevId });
    prevId = addresses.nextBatchPrevId;

    for (const { address, balance, needsConsolidation } of addresses.addresses) {
      const { tokens, spendableBalanceString } = balance;
      const usdtBalance = tokens['trx:usdt']?.spendableBalanceString;

      console.log(`Address ${index}: ${address}`);
      console.log('USDT token balance: ', usdtBalance || 'Does not have USDT balance');
      console.log('TRX balance: ', spendableBalanceString);

      // const data = `${address}, needsConsolidation: ${needsConsolidation}, TRX balance: ${spendableBalanceString}, USDT balance: ${usdtBalance}\n`;
      // fs.appendFileSync('trx-addresses-balance-list.txt', data);

      if (needsConsolidation) {
        const data = `${address}, needsConsolidation: ${needsConsolidation}, USDT balance: ${usdtBalance}, TRX balance: ${spendableBalanceString}\n`;
        fs.appendFileSync('trx-needsConsolidation-true.txt', data);
      } else {
        const data = `${address}, needsConsolidation: ${needsConsolidation}, USDT balance: ${usdtBalance}, TRX balance: ${spendableBalanceString}\n`;
        fs.appendFileSync('trx-needsConsolidation-false.txt', data);
      }

      // if (address.needsConsolidation) {
      //   const data = `${address.address}, needsConsolidation: ${address.needsConsolidation}`;
      //   fs.appendFileSync('trx-needsConsolidation-true', data);
      // } else {
      //   const data = `${address.address}, needsConsolidation: ${address.needsConsolidation}`;
      //   fs.appendFileSync('trx-needsConsolidation-false.txt', data);
      // }

      
      // // Check if the address has USDT && has less than min TRX balance (~35 TRX)
      // if (usdtBalance > 0 && spendableBalanceString < 17021500) {
      //   const data = `${address}, USDC balance: ${usdtBalance}, TRX balance: ${spendableBalanceString}\n`;
      //   fs.appendFileSync('USDC-addresses-with-less-funds.txt', data);
      // }

      // Check if the address has USDT && has more than min TRX balance (~35 TRX)
      // Check the needsConsolidationFlag
    //   if (usdtBalance > 0 && spendableBalanceString > 35000000) {
    //     const data = `${address}, needsConsolidation: ${}, USDT balance: ${usdtBalance}, TRX balance: ${spendableBalanceString}\n`;
    //     fs.appendFileSync('usdt-addresses-with-usdt-and-more-than-min-TRX-needsConsolidation.txt', data);
    //   }
      // Check if the address has USDT balance
      // if (usdtBalance > 0) {
      //   const data = `${address}, USDT balance: ${usdtBalance}, TRX balance: ${spendableBalanceString}\n`;
      //   fs.appendFileSync('addresses-with-usdt.txt', data);
      // }

      // Print all addresses and corresponding USDT balance
      // if (usdtBalance) {
      //   const data = `${address}, USDT balance: ${usdtBalance}, TRX balance: ${spendableBalanceString}\n`;
      //   fs.appendFileSync('usdt-addresses-balance.txt', data);
      // }

      index += 1;
    }
  } while (prevId !== undefined);
}

main().catch((e) => console.error(e));
