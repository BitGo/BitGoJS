/**
 * Get the maximum amount spendable in a single transaction from a wallet.
 * This value is the sum of the 200 most valuable unspent transactions in your wallet.
 * This limit exists because an outbound transaction cannot use more than 200 unspent transactions as input,
 * due to transaction size limits. Note that this value is NOT relevant for account-based coins
 * i.e. [eth, xrp, xlm], as these coins do not use the unspent transactions data model
 *
 * Note that this value may be different than balance, confirmedBalance, and spendableBalance,
 * which can be obtained using the example in the file: get-wallet-balance.ts

 * Copyright 2018, BitGo, Inc.  All Rights Reserved.
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

const walletId = '';

const basecoin = bitgo.coin(coin);

async function main() {
  const wallet = await basecoin.wallets().get({ id: walletId });

  // You may include any, all, or none of these optional parameters
  const optionalParams = {
    limit: 25, // maximum number of selectable unspents
    minValue: 0, // the minimum value of unspents to use in satoshis
    maxValue: 9999999999999, // the maximum value of unspents to use in satoshis
    minHeight: 0, // the minimum height of unspents on the block chain to use
    minConfirms: 2, // all selected unspents will have at least this many confirmations
    enforceMinConfirmsForChange: false, // enforces minConfirms on change inputs
    feeRate: 10000, // fee rate to use in calculation of maximum spendable in satoshis/kB
    maxFeeRate: 100000, // upper limit for feeRate in satoshis/kB
    recipientAddress: '2NCUFDLiUz9CVnmdVqQe9acVonoM89e76df', // recipient address for a more accurate calculation
  };

  //
  // If you want to use the default parameters, don't include those properties in optionalParameters
  //
  // For example you can do:
  //
  // optionalParameters = {};
  //
  //      or
  //
  // optionalParameters = {limit: 50, feeRate: 12000};
  //
  //      or
  //
  // any other combination you'd like to specify
  //

  const response = await wallet.maximumSpendable(optionalParams);

  console.log('Wallet ID:', id);
  console.log('Coin:', response.coin);
  console.log('Maximum Spendable:', response.maximumSpendable);
}

main().catch((e) => console.error(e));
