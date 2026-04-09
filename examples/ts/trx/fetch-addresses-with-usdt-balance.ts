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
  accessToken: '',
  env: 'prod',
});

const coin = 'trx:usdt';
bitgo.register(coin, Trx.createInstance);

const walletId = '';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  let prevId = undefined;
  let index = 1;

  do {
    const addresses = await wallet.addresses({ includeBalances: true, prevId });
    prevId = addresses.nextBatchPrevId;

    for (const { address, balance } of addresses.addresses) {
      const { tokens, spendableBalanceString } = balance;
      const usdtBalance = tokens['trx:usdt']?.spendableBalanceString;

      console.log(`Address ${index}: ${address}`);
      console.log('USDT token balance: ', usdtBalance || 'Does not have USDT balance');
      console.log('TRX balance: ', spendableBalanceString);

      // Check if the address has USDT && has less than min TRX balance (~35 TRX)
      if (usdtBalance > 0 && spendableBalanceString < 36000000) {
        const data = `${address}, USDT balance: ${usdtBalance}, TRX balance: ${spendableBalanceString}\n`;
        fs.appendFileSync('usdt-addresses.txt', data);
      }

      index += 1;
    }
  } while (prevId !== undefined);
}

main().catch((e) => console.error(e));
