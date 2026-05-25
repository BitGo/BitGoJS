/**
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Trx } from '@bitgo/sdk-coin-trx';
import * as fs from 'fs';
import BigNumber from 'bignumber.js';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: '',
  env: 'prod',
});

const coin = 'trx';
bitgo.register(coin, Trx.createInstance);

const walletId = '';

// This script is used for fetching the amount of TRX that can be consolidated
// specifically for wallets which use gas tank to fund addresses in case of token deposit (we block 36 trx for each unique token that is present in the address)
async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  let prevId = undefined;
  let index = 1;

  do {
    const addresses = await wallet.addresses({ includeBalances: true, prevId });
    prevId = addresses.nextBatchPrevId;

    for (const { address, balance, needsConsolidation, tokenConsolidationState } of addresses.addresses) {
      const { tokens, spendableBalanceString } = balance;
      let tokenCounter = 0;
      console.log(`Address ${index}: ${address}`);
      const trxSpendableBalance = new BigNumber(spendableBalanceString || '0');
      console.log('TRX balance: ', trxSpendableBalance);

      // Process token balances if any
      for (const key in tokens) {
        const tokenSpendableBalance = new BigNumber(tokens[key]?.spendableBalanceString || '0');
        console.log(`Token: ${key}, Token spendable balance: ${tokenSpendableBalance}`);
        if (tokenSpendableBalance.isGreaterThan(0)) {
          tokenCounter += 1;
        }  
      }

      if (tokenCounter > 0 && trxSpendableBalance.isGreaterThanOrEqualTo(0)) {
        // This is for enteprises which use gas tank for funding receive addresses with TRX on token deposit
        // we block 36 TRX for each unique token that needs to be consolidated and arrive at the amout of TRX that can be consolidated
        const trxBalanceThatCanBeConsolidated = BigNumber.max(trxSpendableBalance.minus(tokenCounter * 36000000), 0);
        const data = `${address}, No of tokens: ${tokenCounter}, TRX balance: ${trxSpendableBalance}, TRX balance that can be consolidated: ${trxBalanceThatCanBeConsolidated}, V1 flag: ${needsConsolidation}, V2 flag: ${tokenConsolidationState['trx']}\n`;
        fs.appendFileSync('addresses-with-token-balance-and-trx-to-be-consolidated.txt', data);
      } else if (tokenCounter == 0 && trxSpendableBalance.isGreaterThanOrEqualTo(0)) {
        // if address does not have any tokens and has more than 1 TRX, then we need to subtract 1 TRX from it (min TRX thats left in the address)
        const trxBalanceThatCanBeConsolidated = BigNumber.max(trxSpendableBalance.minus(1000000), 0);
        const data = `${address}, No of tokens: ${tokenCounter}, TRX balance: ${trxSpendableBalance}, TRX balance that can be consolidated: ${trxBalanceThatCanBeConsolidated}, V1 flag: ${needsConsolidation}, V2 flag: ${tokenConsolidationState['trx']}\n`;
        fs.appendFileSync('addresses-without-token-balance-and-trx-to-be-consolidated.txt', data);
      }

      index += 1;
    }
  } while (prevId !== undefined);
}

main().catch((e) => console.error(e));